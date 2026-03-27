import json
import uuid
from datetime import datetime
from app.exceptions import AppException
from app.services.card_service import CardService
from app.services.merchant_service import MerchantService


class RecommendationEngine:
    """
    Core recommendation engine.
    Evaluates all coupon × card combinations and returns the optimal one.
    """

    def __init__(self, db):
        self.db = db
        self.card_service = CardService(db)
        self.merchant_service = MerchantService(db)

    def compute(self, user_id: str, merchant_id: str, cart_value: float) -> dict:
        # -----------------------------------------------------------
        # Step 1: Validate merchant
        # -----------------------------------------------------------
        merchant = self.merchant_service.get_merchant_by_id(merchant_id)
        if not merchant:
            raise AppException(
                status_code=404,
                code="MERCHANT_NOT_FOUND",
                message="The selected merchant was not found or is inactive.",
            )

        # -----------------------------------------------------------
        # Step 2: Fetch valid coupons
        # -----------------------------------------------------------
        coupons = self.merchant_service.get_valid_coupons(merchant_id, cart_value)

        # -----------------------------------------------------------
        # Step 3: Fetch user cards
        # -----------------------------------------------------------
        cards = self.card_service.get_user_cards(user_id)

        # -----------------------------------------------------------
        # Step 4: Fetch card merchant rules
        # -----------------------------------------------------------
        card_ids = [str(c["id"]) for c in cards]
        rules = self.card_service.get_merchant_rules(card_ids) if card_ids else []

        # Index rules by card_id
        rules_by_card = {}
        for rule in rules:
            cid = str(rule["card_id"])
            if cid not in rules_by_card:
                rules_by_card[cid] = []
            rules_by_card[cid].append(rule)

        # -----------------------------------------------------------
        # Step 5: Evaluate all combinations
        # -----------------------------------------------------------
        all_evaluations = []
        best_combination = None

        # Include "no coupon" scenario
        coupon_list = coupons + [None]
        # Include "no card" scenario
        card_list = cards + [None] if cards else [None]

        for coupon in coupon_list:
            for card in card_list:
                evaluation = self._evaluate_combination(
                    cart_value, coupon, card, rules_by_card, merchant
                )
                all_evaluations.append(evaluation)

                if best_combination is None or self._is_better(evaluation, best_combination):
                    best_combination = evaluation

        # -----------------------------------------------------------
        # Step 6: Store recommendation
        # -----------------------------------------------------------
        details = {
            "all_evaluations": all_evaluations,
            "total_coupons_evaluated": len(coupons),
            "total_cards_evaluated": len(cards),
            "combinations_evaluated": len(all_evaluations),
        }

        cursor = self.db.cursor()
        rec_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO recommendations (id, user_id, merchant_id, cart_value, final_price, total_savings, details)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                rec_id,
                user_id,
                merchant_id,
                cart_value,
                best_combination["final_price"],
                best_combination["total_savings"],
                json.dumps(details, default=str),
            ),
        )
        self.db.commit()

        # -----------------------------------------------------------
        # Step 7: Build response
        # -----------------------------------------------------------
        return {
            "id": rec_id,
            "merchant_id": merchant_id,
            "merchant_name": merchant["name"],
            "cart_value": cart_value,
            "final_price": best_combination["final_price"],
            "total_savings": best_combination["total_savings"],
            "savings_breakdown": {
                "original_price": cart_value,
                "coupon_savings": best_combination["coupon_discount"],
                "card_savings": best_combination["card_reward"],
                "total_savings": best_combination["total_savings"],
                "final_price": best_combination["final_price"],
                "best_coupon": best_combination.get("coupon_info"),
                "best_card": best_combination.get("card_info"),
            },
            "created_at": datetime.utcnow().isoformat(),
        }

    def _evaluate_combination(
        self,
        cart_value: float,
        coupon: dict | None,
        card: dict | None,
        rules_by_card: dict,
        merchant: dict,
    ) -> dict:
        """Evaluate a single coupon + card combination."""
        coupon_discount = 0.0
        card_reward = 0.0
        coupon_info = None
        card_info = None

        # -----------------------------------------------------------
        # Apply coupon
        # -----------------------------------------------------------
        if coupon:
            discount_type = coupon["discount_type"]
            discount_value = float(coupon["discount_value"])
            max_discount = float(coupon["max_discount"])

            if discount_type == "FLAT":
                coupon_discount = discount_value
            elif discount_type == "PERCENTAGE":
                coupon_discount = cart_value * (discount_value / 100)
            elif discount_type == "CASHBACK":
                coupon_discount = cart_value * (discount_value / 100)

            # Apply max_discount cap
            if max_discount > 0:
                coupon_discount = min(coupon_discount, max_discount)

            # Cannot exceed cart value
            coupon_discount = min(coupon_discount, cart_value)

            coupon_info = {
                "coupon_id": str(coupon["id"]),
                "coupon_code": coupon["code"],
                "discount_type": discount_type,
                "discount_value": discount_value,
                "applied_discount": round(coupon_discount, 2),
            }

        # -----------------------------------------------------------
        # Apply card reward
        # -----------------------------------------------------------
        if card:
            card_id_str = str(card["id"])
            merchant_id_str = str(merchant["id"])
            card_rules = rules_by_card.get(card_id_str, [])

            reward_source = "fallback"
            reward_rate = float(card["cashback_rate"])
            special_cashback = 0.0

            # Priority 1: Exact merchant match
            merchant_rule = next(
                (r for r in card_rules if str(r.get("merchant_id")) == merchant_id_str),
                None,
            )
            if merchant_rule:
                reward_rate = float(merchant_rule["reward_multiplier"])
                special_cashback = float(merchant_rule["special_cashback"])
                reward_source = "merchant_rule"
            else:
                # Priority 2: Category match
                category_rule = next(
                    (r for r in card_rules if r.get("category") == merchant.get("category") and r.get("merchant_id") is None),
                    None,
                )
                if category_rule:
                    reward_rate = float(category_rule["reward_multiplier"])
                    special_cashback = float(category_rule["special_cashback"])
                    reward_source = "category_rule"

            post_coupon_value = cart_value - coupon_discount
            card_reward = post_coupon_value * (reward_rate / 100) + special_cashback

            # Apply max_cap
            max_cap = float(card["max_cap"])
            if max_cap > 0:
                card_reward = min(card_reward, max_cap)

            card_reward = max(card_reward, 0)

            card_info = {
                "card_id": str(card["id"]),
                "card_name": card["card_name"],
                "bank_name": card["bank_name"],
                "reward_source": reward_source,
                "reward_amount": round(card_reward, 2),
            }

        # -----------------------------------------------------------
        # Final price
        # -----------------------------------------------------------
        final_price = cart_value - coupon_discount - card_reward
        final_price = max(final_price, 0)
        total_savings = coupon_discount + card_reward

        return {
            "coupon_discount": round(coupon_discount, 2),
            "card_reward": round(card_reward, 2),
            "total_savings": round(total_savings, 2),
            "final_price": round(final_price, 2),
            "coupon_info": coupon_info,
            "card_info": card_info,
            "coupon_expiry": coupon["expiry_date"].isoformat() if coupon and hasattr(coupon.get("expiry_date", ""), "isoformat") else (str(coupon["expiry_date"]) if coupon else None),
            "card_max_cap": float(card["max_cap"]) if card else 0,
        }

    def _is_better(self, candidate: dict, current_best: dict) -> bool:
        """
        Tie-breaking logic:
        1. Lower final_price wins
        2. Higher total_savings wins
        3. Coupon with later expiry_date wins
        4. Card with higher max_cap wins
        5. First computed result wins (already handled by iteration order)
        """
        if candidate["final_price"] < current_best["final_price"]:
            return True
        if candidate["final_price"] > current_best["final_price"]:
            return False

        # Tie on final_price → compare total_savings
        if candidate["total_savings"] > current_best["total_savings"]:
            return True
        if candidate["total_savings"] < current_best["total_savings"]:
            return False

        # Tie on total_savings → compare coupon expiry
        c_expiry = candidate.get("coupon_expiry") or ""
        b_expiry = current_best.get("coupon_expiry") or ""
        if c_expiry > b_expiry:
            return True
        if c_expiry < b_expiry:
            return False

        # Tie on expiry → compare card max_cap
        if candidate.get("card_max_cap", 0) > current_best.get("card_max_cap", 0):
            return True

        return False
