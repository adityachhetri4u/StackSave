"""
StackSave Seed Script
=====================
Populates the database with demo merchants, coupons, cards, and card_merchant_rules.

Usage:
    cd backend
    python -m scripts.seed

Requires DATABASE_URL in .env
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or "your-" in DATABASE_URL:
    print("⚠️  Please set DATABASE_URL in backend/.env before running seed script.")
    print("   Example: postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres")
    exit(1)


def seed():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cursor = conn.cursor()

    print("🌱 Seeding StackSave database...\n")

    # -----------------------------------------------------------
    # Merchants
    # -----------------------------------------------------------
    merchants = [
        {"id": str(uuid.uuid4()), "name": "Amazon", "category": "E-Commerce"},
        {"id": str(uuid.uuid4()), "name": "Flipkart", "category": "E-Commerce"},
        {"id": str(uuid.uuid4()), "name": "Swiggy", "category": "Food Delivery"},
        {"id": str(uuid.uuid4()), "name": "Zomato", "category": "Food Delivery"},
    ]

    for m in merchants:
        cursor.execute(
            """
            INSERT INTO merchants (id, name, category, is_active)
            VALUES (%s, %s, %s, true)
            ON CONFLICT (id) DO NOTHING
            """,
            (m["id"], m["name"], m["category"]),
        )
    print(f"✅ Inserted {len(merchants)} merchants")

    # -----------------------------------------------------------
    # Coupons (per merchant)
    # -----------------------------------------------------------
    expiry = datetime.utcnow() + timedelta(days=90)
    coupon_templates = [
        {
            "code": "SAVE20",
            "discount_type": "PERCENTAGE",
            "discount_value": 20,
            "min_order_value": 1000,
            "max_discount": 200,
        },
        {
            "code": "FLAT150",
            "discount_type": "FLAT",
            "discount_value": 150,
            "min_order_value": 800,
            "max_discount": 150,
        },
        {
            "code": "CASHBACK10",
            "discount_type": "CASHBACK",
            "discount_value": 10,
            "min_order_value": 500,
            "max_discount": 100,
        },
    ]

    coupon_count = 0
    for m in merchants:
        for ct in coupon_templates:
            cursor.execute(
                """
                INSERT INTO coupons (merchant_id, code, discount_type, discount_value,
                                     min_order_value, max_discount, expiry_date, is_active)
                VALUES (%s, %s, %s::discount_type_enum, %s, %s, %s, %s, true)
                """,
                (
                    m["id"],
                    f"{ct['code']}_{m['name'][:3].upper()}",
                    ct["discount_type"],
                    ct["discount_value"],
                    ct["min_order_value"],
                    ct["max_discount"],
                    expiry,
                ),
            )
            coupon_count += 1
    print(f"✅ Inserted {coupon_count} coupons")

    # -----------------------------------------------------------
    # Demo Cards (user-independent for seed)
    # Note: These will be associated with the first user who signs up.
    # For demo purposes, we use a placeholder user_id.
    # -----------------------------------------------------------
    print("\n📝 Note: Cards and card_merchant_rules require a real user_id.")
    print("   After signing up, use the app to add cards, or update this script")
    print("   with your Supabase user UUID.\n")

    # Print merchant IDs for reference
    print("📋 Merchant IDs for reference:")
    for m in merchants:
        print(f"   {m['name']}: {m['id']}")

    # Print card templates for reference
    print("\n📋 Suggested cards to add via the app:")
    print("   1. HDFC Cashback — HDFC Bank — Credit — 5% cashback — ₹1000 cap")
    print("   2. ICICI Amazon Pay — ICICI Bank — Credit — 2% cashback — ₹500 cap")
    print("   3. SBI SimplyCLICK — SBI — Credit — 1.25% cashback — ₹750 cap")

    print("\n📋 Suggested card_merchant_rules (add via SQL after creating cards):")
    print("   ICICI Amazon Pay → Amazon: 5% multiplier, ₹0 special cashback")
    print("   HDFC Cashback → Swiggy: 10% multiplier, ₹50 special cashback")
    print("   SBI SimplyCLICK → Flipkart: 5% multiplier, ₹25 special cashback")

    conn.commit()
    cursor.close()
    conn.close()

    print("\n🎉 Seed complete!")


if __name__ == "__main__":
    seed()
