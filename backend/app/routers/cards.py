from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.dependencies import get_current_user
from app.database import get_db
from app.models.card import CardCreate, CardResponse
from app.exceptions import AppException

router = APIRouter()


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
