"""
Credit card product database
Master definitions for all supported credit cards
"""

from app.models.credit_card import (
    CreditCardProduct,
    RewardSystem,
    EarnStructure,
    CardBenefit,
    CardFees,
    CardExclusion,
    RewardType,
)


# ========== CREDIT CARDS DATABASE ==========

CREDIT_CARDS: dict = {
    "amazon_pay_icici": CreditCardProduct(
        product_id="amazon_pay_icici",
        card_name="Amazon Pay ICICI Credit Card",
        issuer="ICICI Bank",
        network="Visa",
        card_tier="Premium",
        co_branded=True,
        co_brand_partner="Amazon",
        fees=CardFees(
            joining_fee_inr=0,
            annual_fee_inr=0,
            forex_markup_percent=2.0,
        ),
        reward_system=RewardSystem(
            reward_type=RewardType.CASHBACK,
            earn_structure=[
                EarnStructure(
                    category="amazon",
                    rate_percent=5.0,
                    monthly_cap_inr=None,
                    conditions=["Prime members", "Unlimited"],
                ),
                EarnStructure(
                    category="amazon_non_prime",
                    rate_percent=3.0,
                    monthly_cap_inr=None,
                    conditions=["Non-Prime members"],
                ),
                EarnStructure(
                    category="amazon_pay_partners",
                    rate_percent=2.0,
                    monthly_cap_inr=None,
                ),
                EarnStructure(
                    category="default",
                    rate_percent=1.0,
                    monthly_cap_inr=None,
                ),
            ],
            auto_credit=True,
            credit_cycle="monthly",
        ),
        benefits=[
            CardBenefit(
                name="Amazon Prime Membership",
                description="Free Prime membership for 1 year",
                value_inr=999,
            ),
            CardBenefit(
                name="No forex markup",
                description="On Amazon/Flipkart purchases",
                value_inr=500,
            ),
        ],
        exclusions=[],
        offer_compatibility_rank=1,
        preferred_merchants=["Amazon", "AmazonPay"],
    ),
    "hdfc_millennia": CreditCardProduct(
        product_id="hdfc_millennia",
        card_name="HDFC Millennia Credit Card",
        issuer="HDFC Bank",
        network="Visa",
        card_tier="Classic",
        co_branded=False,
        fees=CardFees(
            joining_fee_inr=1000,
            annual_fee_inr=1000,
            annual_fee_waiver_condition="₹2,00,000 annual spend",
            forex_markup_percent=2.0,
        ),
        reward_system=RewardSystem(
            reward_type=RewardType.POINTS,
            earn_structure=[
                EarnStructure(
                    category="flipkart",
                    points_per_hundred=5.0,
                    monthly_cap_inr=1000,
                    conditions=["Preferred merchant"],
                ),
                EarnStructure(
                    category="amazon",
                    points_per_hundred=5.0,
                    monthly_cap_inr=1000,
                    conditions=["Preferred merchant"],
                ),
                EarnStructure(
                    category="dining",
                    points_per_hundred=5.0,
                    monthly_cap_inr=1000,
                    conditions=["Select merchants"],
                ),
                EarnStructure(
                    category="fuel",
                    points_per_hundred=2.0,
                    monthly_cap_inr=500,
                ),
                EarnStructure(
                    category="default",
                    points_per_hundred=1.0,
                    monthly_cap_inr=250,
                ),
            ],
            point_redemption_value=1.0,
            auto_credit=False,
            conversion_required=True,
        ),
        benefits=[
            CardBenefit(
                name="Fuel surcharge waiver",
                description="5% waiver on fuel/toll",
                value_inr=200,
            ),
            CardBenefit(
                name="Dining discount",
                description="10% off at partner restaurants",
                value_inr=300,
            ),
        ],
        exclusions=[
            CardExclusion(category="rent", reason="Rent payments excluded"),
            CardExclusion(category="insurance", reason="Insurance premiums excluded"),
        ],
        offer_compatibility_rank=2,
        preferred_merchants=["Flipkart", "Amazon", "Swiggy", "Zomato"],
    ),
    "sbi_cashback": CreditCardProduct(
        product_id="sbi_cashback",
        card_name="SBI Cashback Credit Card",
        issuer="State Bank of India",
        network="Mastercard",
        card_tier="Classic",
        co_branded=False,
        fees=CardFees(
            joining_fee_inr=499,
            annual_fee_inr=999,
            annual_fee_waiver_condition="₹2,00,000 annual spend",
            forex_markup_percent=2.0,
        ),
        reward_system=RewardSystem(
            reward_type=RewardType.CASHBACK,
            earn_structure=[
                EarnStructure(
                    category="online",
                    rate_percent=5.0,
                    monthly_cap_inr=2000,
                    conditions=["Online transactions only"],
                ),
                EarnStructure(
                    category="offline",
                    rate_percent=1.0,
                    monthly_cap_inr=2000,
                    conditions=["Physical stores"],
                ),
                EarnStructure(
                    category="fuel",
                    rate_percent=1.0,
                    monthly_cap_inr=500,
                ),
            ],
            auto_credit=True,
            credit_cycle="monthly",
        ),
        benefits=[
            CardBenefit(
                name="Fuel surcharge waiver",
                description="5% on fuel (₹400/month cap)",
                value_inr=200,
            ),
        ],
        exclusions=[
            CardExclusion(category="insurance", reason="Insurance premiums excluded"),
            CardExclusion(category="bill_payment", reason="Bill payments excluded"),
        ],
        offer_compatibility_rank=1,
        preferred_merchants=["Flipkart", "Amazon", "Myntra"],
    ),
    "standard_chartered_ultimate": CreditCardProduct(
        product_id="sc_ultimate",
        card_name="Standard Chartered Ultimate Credit Card",
        issuer="Standard Chartered Bank",
        network="Visa",
        card_tier="Premium",
        co_branded=False,
        fees=CardFees(
            joining_fee_inr=4999,
            annual_fee_inr=4999,
            annual_fee_waiver_condition="₹5,00,000 annual spend",
            forex_markup_percent=1.0,
        ),
        reward_system=RewardSystem(
            reward_type=RewardType.POINTS,
            earn_structure=[
                EarnStructure(
                    category="default",
                    points_per_hundred=5.0,
                    conditions=["5 points per ₹150 = ~3.33% return"],
                ),
                EarnStructure(
                    category="travel",
                    points_per_hundred=10.0,
                    conditions=["Double points on travel"],
                ),
                EarnStructure(
                    category="dining",
                    points_per_hundred=10.0,
                    conditions=["Double points on dining"],
                ),
            ],
            point_redemption_value=0.5,
            auto_credit=False,
            conversion_required=True,
        ),
        benefits=[
            CardBenefit(
                name="Lounge access",
                description="Unlimited airport lounge access",
                value_inr=500,
            ),
            CardBenefit(
                name="Concierge",
                description="24/7 concierge service",
                value_inr=200,
            ),
            CardBenefit(
                name="Travel insurance",
                description="Complimentary travel insurance",
                value_inr=1000,
            ),
        ],
        exclusions=[],
        offer_compatibility_rank=2,
        preferred_merchants=["All"],
    ),
    "hdfc_infinia": CreditCardProduct(
        product_id="hdfc_infinia",
        card_name="HDFC Bank Infinia Credit Card",
        issuer="HDFC Bank",
        network="Visa",
        card_tier="Signature",
        co_branded=False,
        fees=CardFees(
            joining_fee_inr=10000,
            annual_fee_inr=12500,
            annual_fee_waiver_condition="Annual spend >= ₹25,00,000",
            forex_markup_percent=0.0,
        ),
        reward_system=RewardSystem(
            reward_type=RewardType.POINTS,
            earn_structure=[
                EarnStructure(
                    category="smartbuy_travel",
                    points_per_hundred=50.0,
                    monthly_cap_inr=None,
                    conditions=["10x multiplier via SmartBuy portal"],
                ),
                EarnStructure(
                    category="shopping",
                    points_per_hundred=25.0,
                    monthly_cap_inr=None,
                    conditions=["5x multiplier on shopping"],
                ),
                EarnStructure(
                    category="travel",
                    points_per_hundred=25.0,
                    monthly_cap_inr=None,
                    conditions=["5x multiplier on travel"],
                ),
                EarnStructure(
                    category="default",
                    points_per_hundred=5.0,
                    monthly_cap_inr=None,
                    conditions=["1x base earning"],
                ),
            ],
            point_redemption_value=1.0,
            auto_credit=False,
            conversion_required=True,
        ),
        benefits=[
            CardBenefit(
                name="Lounge access",
                description="Unlimited lounge access",
                value_inr=500,
            ),
            CardBenefit(
                name="No forex markup",
                description="Zero forex markup on international spends",
                value_inr=1000,
            ),
            CardBenefit(
                name="Priority banking",
                description="Premium banking privileges",
                value_inr=500,
            ),
        ],
        exclusions=[],
        offer_compatibility_rank=2,
        preferred_merchants=["All (via SmartBuy portal)"],
    ),
    "sbi_simplyclck": CreditCardProduct(
        product_id="sbi_simplyclck",
        card_name="SBI SimplyCLICK Credit Card",
        issuer="State Bank of India",
        network="Visa",
        card_tier="Premium",
        co_branded=False,
        fees=CardFees(
            joining_fee_inr=499,
            annual_fee_inr=499,
            annual_fee_waiver_condition="₹1,00,000 annual spend",
            forex_markup_percent=2.0,
        ),
        reward_system=RewardSystem(
            reward_type=RewardType.POINTS,
            earn_structure=[
                EarnStructure(
                    category="online_shopping",
                    points_per_hundred=10.0,
                    monthly_cap_inr=None,
                    conditions=["10 points per ₹100 on shopping portals"],
                ),
                EarnStructure(
                    category="online_partners",
                    points_per_hundred=50.0,
                    monthly_cap_inr=None,
                    conditions=["5x on partner sites"],
                ),
                EarnStructure(
                    category="fuel",
                    points_per_hundred=50.0,
                    monthly_cap_inr=None,
                    conditions=["5x on fuel/toll"],
                ),
                EarnStructure(
                    category="default",
                    points_per_hundred=10.0,
                    monthly_cap_inr=None,
                    conditions=["1x on other spends"],
                ),
            ],
            point_redemption_value=0.5,
            auto_credit=False,
            conversion_required=True,
        ),
        benefits=[
            CardBenefit(
                name="Fuel surcharge waiver",
                description="5% on fuel (₹100/month cap)",
                value_inr=100,
            ),
        ],
        exclusions=[],
        offer_compatibility_rank=1,
        preferred_merchants=["Flipkart", "Amazon", "Google Play"],
    ),
    "hdfc_diners_privilege": CreditCardProduct(
        product_id="hdfc_diners_privilege",
        card_name="HDFC Diners Club Privilege Credit Card",
        issuer="HDFC Bank",
        network="Diners Club",
        card_tier="Signature",
        co_branded=False,
        fees=CardFees(
            joining_fee_inr=2500,
            annual_fee_inr=2500,
            annual_fee_waiver_condition="₹5,00,000 annual spend",
            forex_markup_percent=2.0,
        ),
        reward_system=RewardSystem(
            reward_type=RewardType.POINTS,
            earn_structure=[
                EarnStructure(
                    category="smartbuy",
                    points_per_hundred=100.0,
                    monthly_cap_inr=None,
                    conditions=["10 points per ₹100 via SmartBuy"],
                ),
                EarnStructure(
                    category="weekend_online",
                    points_per_hundred=50.0,
                    monthly_cap_inr=None,
                    conditions=["5x on weekend online purchases"],
                ),
                EarnStructure(
                    category="default",
                    points_per_hundred=20.0,
                    monthly_cap_inr=None,
                    conditions=["2x base earning"],
                ),
            ],
            point_redemption_value=1.0,
            auto_credit=False,
            conversion_required=True,
        ),
        benefits=[
            CardBenefit(
                name="Lounge access",
                description="Unlimited Diners lounge access",
                value_inr=800,
            ),
            CardBenefit(
                name="Dining privileges",
                description="Premium dining at select restaurants",
                value_inr=1000,
            ),
            CardBenefit(
                name="Fuel surcharge waiver",
                description="5% waiver on fuel/toll",
                value_inr=300,
            ),
        ],
        exclusions=[],
        offer_compatibility_rank=2,
        preferred_merchants=["All (best via SmartBuy)"],
    ),
}


def get_all_cards() -> list:
    """Get all credit card products"""
    return list(CREDIT_CARDS.values())


def get_card_by_id(card_id: str):
    """Get specific credit card product"""
    return CREDIT_CARDS.get(card_id)
