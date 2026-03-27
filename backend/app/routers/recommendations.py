from fastapi import APIRouter, Depends, Request
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_current_user
from app.database import get_db
from app.models.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationHistoryResponse,
)
from app.services.recommendation_engine import RecommendationEngine

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.post("/recommendation", response_model=RecommendationResponse)
@limiter.limit("30/minute")
async def get_recommendation(
    request: Request,
    payload: RecommendationRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Compute the best coupon + card combination for the given merchant and cart value.
    Rate limited: 30 requests per minute per IP.
    """
    engine = RecommendationEngine(db)
    result = engine.compute(
        user_id=current_user["user_id"],
        merchant_id=str(payload.merchant_id),
        cart_value=payload.cart_value,
    )
    return result


@router.get("/recommendations/history", response_model=List[RecommendationHistoryResponse])
async def get_history(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get recommendation history for the authenticated user."""
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT r.id, m.name as merchant_name, r.cart_value, r.final_price,
               r.total_savings, r.created_at, r.details
        FROM recommendations r
        JOIN merchants m ON m.id = r.merchant_id
        WHERE r.user_id = %s
        ORDER BY r.created_at DESC
        LIMIT 50
        """,
        (current_user["user_id"],),
    )
    history = cursor.fetchall()
    return history
