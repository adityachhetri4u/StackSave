"""
Credit card reward calculation engine
Handles complex reward structures, caps, and fee deductions
"""

from typing import List, Dict, Optional
from app.models.credit_card import (
    CreditCardProduct,
    RewardCalculation,
    RewardType,
    CardStackingResult,
    CardComparisonResult,
)


class RewardCalculator:
    """Main reward calculation engine"""

    @staticmethod
    def calculate_reward(
        card: CreditCardProduct,
        purchase_amount: float,
        category: str,
        previous_monthly_earnings: float = 0.0,
    ) -> RewardCalculation:
        """
        Calculate reward for a single card and purchase

        Args:
            card: CreditCardProduct
            purchase_amount: Transaction amount in ₹
            category: Purchase category (e.g., "electronics", "food", "travel")
            previous_monthly_earnings: Running total for month to track caps

        Returns:
            RewardCalculation with reward value and details
        """

        # Check if transaction is excluded
        excluded_categories = [e.category for e in card.exclusions]
        if category in excluded_categories:
            return RewardCalculation(
                card_id=card.product_id,
                card_name=card.card_name,
                issuer=card.issuer,
                purchase_amount=purchase_amount,
                category=category,
                reward_value_inr=0.0,
                reward_percentage=0.0,
                reward_type=card.reward_system.reward_type.value,
                monthly_cap_applied=False,
                is_excluded=True,
            )

        # Find matching earn structure
        matching_structure = None
        for structure in card.reward_system.earn_structure:
            if structure.category.lower() == category.lower():
                matching_structure = structure
                break

        # If no exact match, use default (if exists)
        if not matching_structure:
            for structure in card.reward_system.earn_structure:
                if structure.category.lower() == "default":
                    matching_structure = structure
                    break

        if not matching_structure:
            # No applicable structure
            return RewardCalculation(
                card_id=card.product_id,
                card_name=card.card_name,
                issuer=card.issuer,
                purchase_amount=purchase_amount,
                category=category,
                reward_value_inr=0.0,
                reward_percentage=0.0,
                reward_type=card.reward_system.reward_type.value,
                is_excluded=False,
            )

        # Calculate base reward
        reward_value = 0.0
        reward_percentage = 0.0

        if card.reward_system.reward_type == RewardType.CASHBACK:
            if matching_structure.rate_percent:
                reward_percentage = matching_structure.rate_percent
                reward_value = (purchase_amount * reward_percentage) / 100
        elif card.reward_system.reward_type == RewardType.POINTS:
            if matching_structure.points_per_hundred:
                points_earned = (
                    purchase_amount / 100
                ) * matching_structure.points_per_hundred
                reward_value = (
                    points_earned * card.reward_system.point_redemption_value
                )
                reward_percentage = (
                    reward_value / purchase_amount
                ) * 100 if purchase_amount > 0 else 0
        elif card.reward_system.reward_type == RewardType.HYBRID:
            # Hybrid: combine points earning with occasional cashback
            if matching_structure.points_per_hundred:
                points_earned = (
                    purchase_amount / 100
                ) * matching_structure.points_per_hundred
                reward_value = (
                    points_earned * card.reward_system.point_redemption_value
                )
                reward_percentage = (
                    reward_value / purchase_amount
                ) * 100 if purchase_amount > 0 else 0

        # Apply monthly cap if exists
        monthly_cap_applied = False
        if matching_structure.monthly_cap_inr:
            remaining_cap = max(
                0, matching_structure.monthly_cap_inr - previous_monthly_earnings
            )
            if reward_value > remaining_cap:
                reward_value = remaining_cap
                monthly_cap_applied = True

        # Apply annual cap if exists
        if matching_structure.annual_cap_inr:
            # Note: In production, would need to check annual total from database
            pass

        # Calculate effective discount after fees
        annual_fees = card.fees.annual_fee_inr
        effective_discount = reward_value - (annual_fees / 12)  # Amortize annual fee

        return RewardCalculation(
            card_id=card.product_id,
            card_name=card.card_name,
            issuer=card.issuer,
            purchase_amount=purchase_amount,
            category=category,
            reward_value_inr=reward_value,
            reward_percentage=reward_percentage,
            reward_type=card.reward_system.reward_type.value,
            monthly_cap_applied=monthly_cap_applied,
            is_excluded=False,
            effective_discount_after_fees=effective_discount,
        )

    @staticmethod
    def compare_cards(
        cards: List[CreditCardProduct],
        purchase_amount: float,
        category: str,
    ) -> CardComparisonResult:
        """
        Compare multiple cards for best reward on given purchase

        Args:
            cards: List of CreditCardProduct to compare
            purchase_amount: Transaction amount
            category: Purchase category

        Returns:
            CardComparisonResult with rankings
        """
        calculations = []

        for card in cards:
            calc = RewardCalculator.calculate_reward(
                card, purchase_amount, category
            )
            calculations.append(calc)

        # Sort by reward value (descending)
        sorted_calcs = sorted(
            calculations, key=lambda x: x.reward_value_inr, reverse=True
        )

        # Estimate annual savings (assuming 12 similar purchases)
        annual_savings = sorted_calcs[0].reward_value_inr * 12 if sorted_calcs else 0

        return CardComparisonResult(
            purchase_amount=purchase_amount,
            category=category,
            best_card=sorted_calcs[0],
            top_5_cards=sorted_calcs[:5],
            estimated_annual_savings=annual_savings,
            total_cards_compared=len(cards),
        )

    @staticmethod
    def calculate_stacking(
        card: CreditCardProduct,
        card_reward_inr: float,
        bank_offer_discount_inr: float,
    ) -> CardStackingResult:
        """
        Calculate stacking with bank offer

        Args:
            card: CreditCardProduct
            card_reward_inr: Reward earned from card
            bank_offer_discount_inr: Discount from bank offer

        Returns:
            CardStackingResult
        """
        # Check if card is compatible with offer stacking
        is_compatible = card.offer_compatibility_rank <= 2  # Rank 1-2 = compatible

        total_savings = 0.0
        if is_compatible:
            total_savings = card_reward_inr + bank_offer_discount_inr

        return CardStackingResult(
            card_id=card.product_id,
            card_name=card.card_name,
            card_reward_inr=card_reward_inr,
            bank_offer_discount_inr=bank_offer_discount_inr,
            total_savings_inr=total_savings,
            is_compatible=is_compatible,
        )
