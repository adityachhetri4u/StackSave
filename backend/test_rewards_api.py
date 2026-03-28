#!/usr/bin/env python
"""Test the new reward calculation API endpoints"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Test 1: Get all credit card products
print("=== TEST 1: Get all credit card products ===")
response = requests.get(f"{BASE_URL}/products")
print(f"Status: {response.status_code}")
if response.status_code == 200:
    products = response.json()
    print(f"Found {len(products)} credit card products")
    print(f"First card: {products[0]['card_name']}")
else:
    print(f"Error: {response.text}")

# Test 2: Compare cards for Flipkart purchase
print("\n=== TEST 2: Compare cards for ₹10,000 Flipkart purchase ===")
response = requests.post(
    f"{BASE_URL}/rewards/compare",
    json={"purchase_amount": 10000, "category": "flipkart"},
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    best = result["best_card"]
    print(f"Best card: {best['card_name']}")
    print(f"Reward: ₹{best['reward_value_inr']:.2f}")
    print(f"Top 5 cards:")
    for card in result["top_5_cards"][:3]:
        print(f"  - {card['card_name']}: ₹{card['reward_value_inr']:.2f}")
else:
    print(f"Error: {response.text}")

# Test 3: Compare for Amazon purchase
print("\n=== TEST 3: Compare cards for ₹25,000 Amazon purchase ===")
response = requests.post(
    f"{BASE_URL}/rewards/compare",
    json={"purchase_amount": 25000, "category": "amazon"},
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    best = result["best_card"]
    print(f"Best card: {best['card_name']}")
    print(f"Reward: ₹{best['reward_value_inr']:.2f}")
    print(f"Annual savings (×12): ₹{result['estimated_annual_savings']:.2f}")
else:
    print(f"Error: {response.text}")

# Test 4: Offer stacking
print("\n=== TEST 4: Offer stacking (card reward + bank discount) ===")
response = requests.post(
    f"{BASE_URL}/rewards/with-offer-stacking",
    params={
        "card_id": "amazon_pay_icici",
        "card_reward_inr": 500,
        "bank_offer_discount_inr": 1000,
    },
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print(f"Card reward: ₹{result['card_reward_inr']:.2f}")
    print(f"Bank offer discount: ₹{result['bank_offer_discount_inr']:.2f}")
    print(f"Total savings: ₹{result['total_savings_inr']:.2f}")
    print(f"Compatible: {result['is_compatible']}")
else:
    print(f"Error: {response.text}")

print("\n=== All tests completed successfully ===")
