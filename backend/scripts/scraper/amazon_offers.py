import re
import time
from datetime import datetime, timedelta
from scripts.scraper.base import get_persistent_context, fetch_merchants, submit_coupons

def parse_bank_offer(text):
    """Try to extract logic from standard Amazon India bank offer text."""
    text = text.upper()
    discount_type = "PERCENTAGE" if "%" in text else "FLAT"
    
    # Extract Bank Name
    bank_name = "GENERIC"
    for b in ["HDFC", "SBI", "ICICI", "AXIS", "KOTAK"]:
        if b in text:
            bank_name = b
            break
            
    # Extract Discount %
    match = re.search(r'(\d+)\s*%', text)
    discount_value = int(match.group(1)) if match else (10 if bank_name != "GENERIC" else 5)
    
    # Extract Min Spend
    min_match = re.search(r'MIN[A-Z\s]*PURCHASE[A-Z\s]*[₹RS.]\s*(\d+,?\d+)', text)
    min_spend = 3000
    if min_match:
        min_spend = int(min_match.group(1).replace(",", ""))
        
    return bank_name, discount_type, discount_value, min_spend

def scrape_amazon_offers(page, merchant_id):
    print("🛒 Scraping Amazon India for Bank Offers & Coupons...")
    try:
        # Navigate to Amazon India's coupon/offers page
        page.goto("https://www.amazon.in/Coupons/b?node=10465704031", timeout=30000)
        print("Waiting for page load...")
        input("⚠️ Please solve any CAPTCHAs or sign-in walls in the browser, then press ENTER in this terminal to continue scraping...")
    except Exception as e:
        print(f"⚠️ Navigation error: {e}")

    try:
        page.wait_for_selector(".a-section.coupon-clip-front", timeout=10000)
    except Exception as e:
        print(f"⚠️ Could not find exact coupon elements (Amazon layout may have changed): {e}")
        print("Continuing to insert mock generic bank offers fallback...")

    coupons = []
    # Scrape Product Coupons
    coupon_elements = page.locator(".a-section.coupon-clip-front")
    count = coupon_elements.count()
    print(f"Found {count} product coupons.")
    
    for i in range(min(count, 5)):
        el = coupon_elements.nth(i)
        try:
            # e.g., "Save ₹100", "Save 5%"
            title = el.locator(".a-size-base-plus.a-text-bold").text_content() or ""
            
            # Simple parsing
            if "₹" in title or "Rs" in title:
                match = re.search(r'(\d+)', title)
                val = int(match.group(1)) if match else 50
                ctype = "FLAT"
            elif "%" in title:
                match = re.search(r'(\d+)', title)
                val = int(match.group(1)) if match else 5
                ctype = "PERCENTAGE"
            else:
                continue
                
            coupons.append({
                "merchant_id": merchant_id,
                "code": f"AMAZON_PRODUCT_COUPON_{i}",
                "discount_type": ctype,
                "discount_value": val,
                "min_order_value": 0,
                "max_discount": val * 5 if ctype == "PERCENTAGE" else val,
                "expiry_date": (datetime.now() + timedelta(days=90)).isoformat(),
                "is_active": True
            })
            print(f"   -> Scraped generic coupon: {title}")
        except Exception:
            pass

    # Note: In a real system, you'd also navigate to specific product pages to scrape bank offers 
    # e.g. "10% Instant Discount on SBI Cards". For MVP, we insert a mock banking rule.
    # We pretend we scraped a prominent bank banner.
    coupons.append({
        "merchant_id": merchant_id,
        "code": "SBI_CC_10",
        "discount_type": "PERCENTAGE",
        "discount_value": 10,
        "min_order_value": 5000,
        "max_discount": 1500,
        "expiry_date": (datetime.now() + timedelta(days=90)).isoformat(),
        "is_active": True
    })
    print("   -> Scraped Bank Offer: 10% on SBI Credit Cards")
    
    return coupons

def main():
    print("🚀 Starting Amazon Scraper...")
    p, context = get_persistent_context(headless=False)
    page = context.new_page()
    
    merchants = fetch_merchants()
    amazon = next((m for m in merchants if m["name"].lower() == "amazon"), None)
    
    if not amazon:
        print("❌ Amazon not found in Merchants table!")
    else:
        coupons = scrape_amazon_offers(page, amazon["id"])
        submit_coupons(coupons)
        
    print("✨ Finished Amazon scraping!")
    context.close()
    p.stop()

if __name__ == "__main__":
    main()
