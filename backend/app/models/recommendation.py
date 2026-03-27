from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class RecommendationRequest(BaseModel):
    merchant_id: UUID
    cart_value: float = Field(..., gt=0, description="Cart value in ₹")


class CouponBreakdown(BaseModel):
    coupon_id: Optional[str] = None
    coupon_code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: float = 0
    applied_discount: float = 0


class CardBreakdown(BaseModel):
    card_id: Optional[str] = None
    card_name: Optional[str] = None
    bank_name: Optional[str] = None
    reward_source: Optional[str] = None  # "merchant_rule", "category_rule", "fallback"
    reward_amount: float = 0


class SavingsBreakdown(BaseModel):
    original_price: float
    coupon_savings: float = 0
    card_savings: float = 0
    total_savings: float = 0
    final_price: float
    best_coupon: Optional[CouponBreakdown] = None
    best_card: Optional[CardBreakdown] = None


class RecommendationResponse(BaseModel):
    id: UUID
    merchant_id: UUID
    merchant_name: str
    cart_value: float
    final_price: float
    total_savings: float
    savings_breakdown: SavingsBreakdown
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationHistoryResponse(BaseModel):
    id: UUID
    merchant_name: str
    cart_value: float
    final_price: float
    total_savings: float
    created_at: datetime
    details: dict

    class Config:
        from_attributes = True
