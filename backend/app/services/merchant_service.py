class MerchantService:
    """Service for merchant-related database operations."""

    def __init__(self, db):
        self.db = db

    def get_merchant_by_id(self, merchant_id: str) -> dict | None:
        cursor = self.db.cursor()
        cursor.execute(
            "SELECT * FROM merchants WHERE id = %s AND is_active = true",
            (merchant_id,),
        )
        return cursor.fetchone()

    def get_valid_coupons(self, merchant_id: str, cart_value: float) -> list:
        """Fetch coupons that are active, not expired, and meet min_order_value."""
        cursor = self.db.cursor()
        cursor.execute(
            """
            SELECT * FROM coupons
            WHERE merchant_id = %s
              AND is_active = true
              AND expiry_date > NOW()
              AND min_order_value <= %s
            ORDER BY discount_value DESC
            """,
            (merchant_id, cart_value),
        )
        return cursor.fetchall()
