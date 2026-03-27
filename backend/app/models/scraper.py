from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class ScraperRequest(BaseModel):
    url: str

class ScrapedOffer(BaseModel):
    bank_name: str
    discount_type: str # FLAT, PERCENTAGE, CASHBACK
    discount_value: float
    min_spend: Optional[float] = 0.0
    max_discount: Optional[float] = 0.0
    payment_type: str # credit_card, debit_card, emi
    raw_text: str

class ScrapedCoupon(BaseModel):
    code: str
    description: str
    discount_type: str  # FLAT, PERCENTAGE
    discount_value: float
    min_order_value: Optional[float] = 0.0
    max_discount: Optional[float] = 0.0
    source: str = "product_page"  # product_page, platform_wide

class ScraperResponse(BaseModel):
    product_price: float
    product_name: str = "Unknown Product"
    offers: List[ScrapedOffer]
    coupons: List[ScrapedCoupon] = []
    best_coupon: Optional[ScrapedCoupon] = None
