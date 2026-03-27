import re
from datetime import datetime, timedelta
from scripts.scraper.base import get_persistent_context, fetch_merchants, submit_coupons

def parse_discount(title):
    """Simple parser to extract discount value and type from typical coupon text."""
    title = title.upper()
    
    if "%" in title or "PERCENT" in title:
        match = re.search(r'(\d+)\s*%', title)
        val = int(match.group(1)) if match else 10
        return "PERCENTAGE", val
        
    if "FLAT" in title or "₹" in title or "RS" in title:
        match = re.search(r'(?:₹|RS\.?\s*)(\d+)', title)
        val = int(match.group(1)) if match else 50
        return "FLAT", val
        
    if "CASHBACK" in title:
        match = re.search(r'(\d+)\s*%', title)
        val = int(match.group(1)) if match else 5
        return "CASHBACK", val
        
    return "FLAT", 50 # Default safe fallback


def scrape_coupondunia(page, merchant_name, merchant_id):
    print(f"🔍 Scraping CouponDunia for {merchant_name}...")
    url_name = merchant_name.lower().replace(" ", "-")
    
    # Go to the merchant's coupon page
    try:
        page.goto(f"https://www.coupondunia.in/{url_name}", timeout=30000)
        print("Waiting for page load...")
        input("⚠️ Please solve any CAPTCHAs/popups in the browser, then press ENTER in this terminal to scrape...")
        page.wait_for_selector(".offer-card-wrapper", timeout=15000)
    except Exception as e:
        print(f"⚠️ Could not load CouponDunia for {merchant_name} (might not exist): {e}")
        return []

    coupons = []
    cards = page.locator(".offer-card-wrapper .offer-card")
    count = cards.count()
    
    print(f"Found {count} offer cards for {merchant_name}")
    
    for i in range(min(count, 5)): # Just take top 5 coupons to prevent spam
        card = cards.nth(i)
        
        try:
            # Need to get text content carefully
            title_el = card.locator(".offer-title")
            title = title_el.text_content().strip() if title_el.count() > 0 else "Special Offer"
            
            # This is tricky because real coupon sites hide codes behind a click.
            # For our Layer 1 scraping MVP, we'll capture the title and create a mock code IF hidden, 
            # or extract the generic coupon text.
            code_el = card.locator(".get-code-btn")
            code_text = code_el.text_content().strip() if code_el.count() > 0 else ""
            
            # Generate a code based on the title if it's hidden (like SHOW COUPON)
            code = f"CD_{merchant_name.upper().replace(' ', '')}{i+1}"
            if "SHOW" not in code_text.upper() and code_text:
                code = code_text
                
            discount_type, discount_value = parse_discount(title)
            
            coupons.append({
                "merchant_id": merchant_id,
                "code": code[:50],
                "discount_type": discount_type,
                "discount_value": discount_value,
                "min_order_value": 500, # Mock generic constraint derived from reading typically
                "max_discount": discount_value * 5 if discount_type == "PERCENTAGE" else discount_value,
                "expiry_date": (datetime.now() + timedelta(days=90)).isoformat(),
                "is_active": True
            })
            print(f"   -> Scraped: {code} ({discount_type} {discount_value})")
        except Exception as e:
            print(f"   -> Error parsing card: {e}")
            
    return coupons

def main():
    print("🚀 Starting Generic Coupon Scraper (CouponDunia)...")
    p, context = get_persistent_context(headless=False) # Headless=False so user can see it
    page = context.new_page()
    
    merchants = fetch_merchants()
    if not merchants:
        print("❌ No active merchants found in Supabase Database. Add some first!")
        context.close()
        p.stop()
        return
        
    all_coupons = []
    
    for m in merchants:
        coupons = scrape_coupondunia(page, m["name"], m["id"])
        all_coupons.extend(coupons)
        
    # Upsert findings directly to StackSave DB
    submit_coupons(all_coupons)
    
    print("✨ Finished coupon scraping!")
    context.close()
    p.stop()

if __name__ == "__main__":
    main()
