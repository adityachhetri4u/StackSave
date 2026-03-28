from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.database import get_db
from app.models.card import CardCreate, CardResponse
from app.models.credit_card import (
    RewardCalculation,
    CardComparisonResult,
    CreditCardProduct,
)
from app.exceptions import AppException
from app.config import get_settings
from app.services.rewards import RewardCalculator, get_all_cards, get_card_by_id

router = APIRouter()

# Diagnostic endpoint to debug auth issues
@router.get("/cards/debug/status")
async def debug_status(authorization: str = Header(None)):
    """Debug endpoint to check auth status"""
    settings = get_settings()
    return {
        "jwt_secret_prefix": settings.supabase_jwt_secret[:30] + "...",
        "has_auth_header": bool(authorization),
        "auth_header_preview": (authorization[:50] + "...") if authorization else "NONE",
        "backend_url": settings.supabase_url,
    }

@router.get("/cards", response_model=List[CardResponse])
async def list_cards(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """List all cards belonging to the authenticated user."""
    cursor = db.cursor()
    cursor.execute(
        "SELECT * FROM cards WHERE user_id = %s ORDER BY created_at DESC",
        (current_user["user_id"],),
    )
    cards = cursor.fetchall()
    return cards


@router.post("/cards", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(
    card: CardCreate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Add a new card for the authenticated user."""
    cursor = db.cursor()
    cursor.execute(
        """
        INSERT INTO cards (user_id, card_name, bank_name, card_type, cashback_rate, max_cap)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING *
        """,
        (
            current_user["user_id"],
            card.card_name,
            card.bank_name,
            card.card_type,
            card.cashback_rate,
            card.max_cap,
        ),
    )
    new_card = cursor.fetchone()
    db.commit()
    return new_card


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
    card_id: UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Delete a card owned by the authenticated user."""
    cursor = db.cursor()
    cursor.execute(
        "DELETE FROM cards WHERE id = %s AND user_id = %s RETURNING id",
        (str(card_id), current_user["user_id"]),
    )
    deleted = cursor.fetchone()
    if not deleted:
        raise AppException(
            status_code=404,
            code="CARD_NOT_FOUND",
            message="Card not found or does not belong to you.",
        )
    db.commit()


# ========== REWARD CALCULATION ENDPOINTS ==========


class RewardCalculationRequest(BaseModel):
    """Request body for reward calculation"""
    purchase_amount: float
    category: str


class CardComparisonRequest(BaseModel):
    """Request body for card comparison"""
    purchase_amount: float
    category: str


@router.get("/products", response_model=List[CreditCardProduct])
async def get_all_credit_card_products():
    """Get all available credit card products"""
    return get_all_cards()


@router.get("/products/{product_id}", response_model=CreditCardProduct)
async def get_credit_card_product(product_id: str):
    """Get specific credit card product"""
    card = get_card_by_id(product_id)
    if not card:
        raise HTTPException(
            status_code=404,
            detail=f"Credit card product '{product_id}' not found",
        )
    return card


@router.post("/rewards/calculate", response_model=List[RewardCalculation])
async def calculate_user_card_rewards(
    request: RewardCalculationRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Calculate rewards for all user's saved cards for a specific purchase.
    
    Returns:
        List of RewardCalculation objects sorted by reward value (highest first)
    """
    # Fetch user's saved cards
    cursor = db.cursor()
    cursor.execute(
        "SELECT credit_card_product_id FROM cards WHERE user_id = %s",
        (current_user["user_id"],),
    )
    user_cards = cursor.fetchall()

    if not user_cards:
        return []

    # Calculate rewards for each card
    calculations = []
    for row in user_cards:
        product_id = row[0]
        if product_id:  # Only if linked to product
            card = get_card_by_id(product_id)
            if card:
                calc = RewardCalculator.calculate_reward(
                    card,
                    request.purchase_amount,
                    request.category.lower(),
                )
                calculations.append(calc)

    # Sort by reward value (highest first)
    calculations.sort(key=lambda x: x.reward_value_inr, reverse=True)
    return calculations


@router.post("/rewards/compare", response_model=CardComparisonResult)
async def compare_cards_for_purchase(
    request: CardComparisonRequest,
):
    """
    Compare all available credit cards for optimal reward on a specific purchase.
    
    Returns:
        CardComparisonResult with best card and top 5 options
    """
    all_cards = get_all_cards()
    result = RewardCalculator.compare_cards(
        all_cards,
        request.purchase_amount,
        request.category.lower(),
    )
    return result


@router.post("/rewards/with-offer-stacking")
async def calculate_with_offer_stacking(
    card_id: str = Query(..., description="Credit card product ID"),
    card_reward_inr: float = Query(..., description="Reward earned from card"),
    bank_offer_discount_inr: float = Query(
        ..., description="Discount from bank offer"
    ),
):
    """
    Calculate total savings with offer stacking (card reward + bank offer discount)
    """
    card = get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    result = RewardCalculator.calculate_stacking(
        card, card_reward_inr, bank_offer_discount_inr
    )
    return result
