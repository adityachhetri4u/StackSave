class CardService:
    """Service for card-related database operations."""

    def __init__(self, db):
        self.db = db

    def get_user_cards(self, user_id: str) -> list:
        cursor = self.db.cursor()
        cursor.execute(
            "SELECT * FROM cards WHERE user_id = %s",
            (user_id,),
        )
        return cursor.fetchall()

    def get_merchant_rules(self, card_ids: list, merchant_id: str = None, category: str = None) -> list:
        """Fetch card_merchant_rules for given card IDs, optionally filtered by merchant or category."""
        if not card_ids:
            return []
        placeholders = ",".join(["%s"] * len(card_ids))
        cursor = self.db.cursor()
        cursor.execute(
            f"""
            SELECT * FROM card_merchant_rules
            WHERE card_id IN ({placeholders})
            """,
            card_ids,
        )
        return cursor.fetchall()
