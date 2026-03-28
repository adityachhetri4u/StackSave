from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


class RewardType(str, Enum):
    """Reward type enum"""
    CASHBACK = "cashback"
    POINTS = "points"
    MILES = "miles"
    HYBRID = "hybrid"


class EarnStructure(BaseModel):
    """Earnings for a category"""
    category: str
    rate_percent: Optional[float] = None  # For cashback
    points_per_hundred: Optional[float] = None  # For points per ₹100
    multiplier: Optional[float] = None  # For multiplier points
    monthly_cap_inr: Optional[float] = None
    annual_cap_inr: Optional[float] = None
    conditions: Optional[List[str]] = None


class RewardSystem(BaseModel):
    """Complete reward earning system"""
    reward_type: RewardType
    earn_structure: List[EarnStructure]
    point_redemption_value: Optional[float] = 1.0  # ₹ per point
    auto_credit: bool = False
    credit_cycle: str = "monthly"
    expiry_months: Optional[int] = None
    conversion_required: bool = False


class CardBenefit(BaseModel):
    """Card benefits"""
    name: str
    description: str
    value_inr: Optional[float] = None


class CardFees(BaseModel):
    """Fee structure"""
    joining_fee_inr: float = 0
    annual_fee_inr: float = 0
    annual_fee_waiver_condition: Optional[str] = None
    forex_markup_percent: float = 0
    interest_rate_monthly_percent: float = 2.0


class CardExclusion(BaseModel):
    """Transaction exclusions"""
    category: str
    reason: str


class CreditCardProduct(BaseModel):
    """Master credit card product from issuer"""
    product_id: str  # e.g., "hdfc_millennia_v1"
    card_name: str
    issuer: str
    network: str  # VISA, Mastercard, Amex, RuPay
    card_tier: str  # Classic, Premium, Signature, Infinity
    co_branded: bool = False
    co_brand_partner: Optional[str] = None
    
    # Fee structure
    fees: CardFees
    
    # Reward system
    reward_system: RewardSystem
    
    # Benefits
    benefits: List[CardBenefit] = []
    
    # Exclusions
    exclusions: List[CardExclusion] = []
    
    # Rules
    offer_compatibility_rank: int = 1  # 1=all offers, 2=some, 3=none
    preferred_merchants: List[str] = []
    
    class Config:
        from_attributes = True


class RewardCalculation(BaseModel):
    """Result of reward calculation"""
    card_id: str
    card_name: str
    issuer: str
    purchase_amount: float
    category: str
    reward_value_inr: float
    reward_percentage: float
    reward_type: str
    monthly_cap_applied: bool = False
    is_excluded: bool = False
    effective_discount_after_fees: Optional[float] = None


class CardStackingResult(BaseModel):
    """Stacking opportunity"""
    card_id: str
    card_name: str
    card_reward_inr: float
    bank_offer_discount_inr: float
    total_savings_inr: float
    is_compatible: bool


class CardComparisonResult(BaseModel):
    """Comparison across cards"""
    purchase_amount: float
    category: str
    best_card: RewardCalculation
    top_5_cards: List[RewardCalculation]
    estimated_annual_savings: float
    total_cards_compared: int
