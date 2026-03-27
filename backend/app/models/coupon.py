from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from enum import Enum


class DiscountType(str, Enum):
    FLAT = "FLAT"
    PERCENTAGE = "PERCENTAGE"
    CASHBACK = "CASHBACK"


class CouponResponse(BaseModel):
    id: UUID
    merchant_id: UUID
    code: str
    discount_type: DiscountType
    discount_value: float
    min_order_value: float
    max_discount: float
    expiry_date: datetime
    is_active: bool

    class Config:
        from_attributes = True
