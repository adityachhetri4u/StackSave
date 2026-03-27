from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class CardCreate(BaseModel):
    card_name: str = Field(..., min_length=1, max_length=100, examples=["HDFC Cashback"])
    bank_name: str = Field(..., min_length=1, max_length=100, examples=["HDFC Bank"])
    card_type: str = Field(..., min_length=1, max_length=50, examples=["Credit"])
    cashback_rate: float = Field(default=0.0, ge=0, le=100, description="Fallback cashback percentage")
    max_cap: float = Field(default=0.0, ge=0, description="Maximum cashback cap in ₹")


class CardResponse(BaseModel):
    id: UUID
    user_id: UUID
    card_name: str
    bank_name: str
    card_type: str
    cashback_rate: float
    max_cap: float
    created_at: datetime

    class Config:
        from_attributes = True


class CardMerchantRuleResponse(BaseModel):
    id: UUID
    card_id: UUID
    merchant_id: Optional[UUID] = None
    category: Optional[str] = None
    reward_multiplier: float
    special_cashback: float

    class Config:
        from_attributes = True
