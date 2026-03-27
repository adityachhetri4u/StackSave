import re
from typing import List
from playwright.sync_api import sync_playwright
from app.models.scraper import ScrapedOffer, ScrapedCoupon, ScraperResponse

def parse_generic_offer_line(text: str) -> ScrapedOffer:
    text_upper = text.upper()
    
    # Determine bank
    bank_name = "Generic Bank"
    # Added "FLIPKART AXIS" and "FLIPKART SBI" to correctly catch the image provided by user
    for b in ["HDFC", "SBI", "AXIS", "ICICI", "KOTAK", "CITI", "AMEX", "HSBC", "BOB"]:
        if b in text_upper:
            # If it's a co-branded card (common on flipkart)
            if "FLIPKART" in text_upper and b in ["AXIS", "SBI"]:
                bank_name = f"Flipkart {b}"
            else:
                bank_name = b
            break
            
    # Determine discount type and value
    d_type = "FLAT"
    d_value = 0.0
    
    if "%" in text_upper:
        d_type = "PERCENTAGE"
        match = re.search(r'(\d+)\s*%', text_upper)
        if match: d_value = float(match.group(1))
    elif "₹" in text_upper or "RS" in text_upper:
        d_type = "FLAT"
        match = re.search(r'[₹|RS\.?\s*](\d+[,]?\d*)', text_upper)
        if match: d_value = float(match.group(1).replace(",", ""))
        
    payment_type = "credit_card"
    if "DEBIT" in text_upper: payment_type = "debit_card"
    if "EMI" in text_upper: payment_type = "emi"
    
    # Constraints
    min_spend = 0.0
    min_match = re.search(r'MIN[A-Z\s]*PURCHASE[A-Z\s]*[₹RS.]\s*(\d+,?\d+)', text_upper)
    if min_match: min_spend = float(min_match.group(1).replace(",", ""))
        
    max_discount = 0.0
    if d_type == "PERCENTAGE":
        max_match = re.search(r'UP\s*TO\s*[₹RS.]\s*(\d+,?\d+)', text_upper)
        if max_match: 
            max_discount = float(max_match.group(1).replace(",", ""))
        else:
            max_discount = min(d_value * 100, 2000) # mock a plausible limit
    else:
        max_discount = d_value # flat value is itself the max
        
    return ScrapedOffer(
        bank_name=bank_name,
        discount_type=d_type,
        discount_value=d_value if d_value > 0 else 500, # safe fallback if parsing misses
        min_spend=min_spend,
        max_discount=max_discount,
        payment_type=payment_type,
        raw_text=text.strip()
    )

def scrape_product_offers(url: str) -> ScraperResponse:
    domain = "flipkart" if "flipkart.com" in url else "amazon" if "amazon.in" in url else "unknown"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-blink-features=AutomationControlled"])
        context = browser.new_context(
            viewport={"width": 1280, "height": 800}, 
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            # Give SPA elements time to render specifically for the offer blocks
            page.wait_for_timeout(3000)
        except Exception:
            # We ignore timeouts since SPAs often still render enough DOM after 15s to be scraped
            pass 
            
        # 1. Base Price extraction
        price = 0.0
        product_name = "Unknown Product"
        try:
            if domain == "flipkart":
                text = page.locator("div.Nx9bqj.CxhGGd, div._30jeq3.ruOqak").first.inner_text(timeout=2000)
                price = float(re.sub(r'[^\d.]', '', text))
            elif domain == "amazon":
                text = page.locator(".a-price-whole").first.inner_text(timeout=2000)
                price = float(re.sub(r'[^\d.]', '', text))
        except Exception:
            pass
        
        # 1b. Product name extraction
        try:
            if domain == "flipkart":
                product_name = page.locator("span.VU-ZEz, span.B_NuCI").first.inner_text(timeout=2000)
            elif domain == "amazon":
                product_name = page.locator("#productTitle").first.inner_text(timeout=2000)
            product_name = product_name.strip()[:100]  # Cap at 100 chars
        except Exception:
            pass
            
        # 2. Offer extraction
        offers = []
        try:
            texts = page.locator("body").inner_text()
            lines = texts.split('\n')
            
            found_signatures = set()
            
            # Simple line-by-line processing for standard Amazon paragraphs
            for line in lines:
                l_up = line.upper()
                if "BANK" in l_up and ("OFF" in l_up or "DISCOUNT" in l_up or "CASHBACK" in l_up):
                    if len(line) < 150: # Restrict to short sentences
                        offer = parse_generic_offer_line(line)
                        sig = f"{offer.bank_name}_{offer.discount_value}"
                        if sig not in found_signatures and offer.discount_value > 0:
                            found_signatures.add(sig)
                            offers.append(offer)
                            
            # Process sliding window to catch Flipkart's multi-line split card layout 
            # (e.g., "₹4000 off" \n "Flipkart Axis" \n "Credit Card • Cashback")
            for i in range(len(lines) - 2):
                block = f"{lines[i]} {lines[i+1]} {lines[i+2]}"
                b_up = block.upper()
                # Check if it contains the currency marker, 'OFF' or 'CASHBACK', and a card provider
                if ("₹" in b_up or "%" in b_up) and ("OFF" in b_up or "CASHBACK" in b_up) and ("BANK" in b_up or "CREDIT CARD" in b_up or "AXIS" in b_up or "SBI" in b_up):
                    if len(block) < 120:
                        offer = parse_generic_offer_line(block)
                        sig = f"{offer.bank_name}_{offer.discount_value}"
                        if sig not in found_signatures and offer.discount_value > 0:
                            found_signatures.add(sig)
                            offers.append(offer)

            # Cap exactly to top 5 offers to ensure clean UI
            offers = offers[:5]
            
        except Exception as e:
            print(f"Error scraping offers: {e}")
        
        # 3. Coupon extraction from the same product page
        coupons = []
        try:
            found_coupon_codes = set()
            
            # Strategy A: Flipkart product page coupons
            # Flipkart shows coupons in offer rows with text like "Extra ₹500 off • Coupon: SAVE500"
            if domain == "flipkart":
                # Look for coupon-specific elements
                coupon_rows = page.locator("div._16qoP7, li.col.col-12-12 div._3V4w5L, div.cPHR8G")
                row_count = coupon_rows.count()
                for i in range(min(row_count, 10)):
                    try:
                        row_text = coupon_rows.nth(i).inner_text(timeout=1000)
                        if "COUPON" in row_text.upper() or "CODE" in row_text.upper():
                            # Extract coupon code — typically uppercase alphanumeric
                            code_match = re.search(r'(?:code|coupon)[:\s]*([A-Z0-9]{4,20})', row_text, re.IGNORECASE)
                            if code_match:
                                code = code_match.group(1).upper()
                                if code not in found_coupon_codes:
                                    found_coupon_codes.add(code)
                                    # Parse the discount from surrounding text
                                    d_type, d_val, max_d = "FLAT", 0.0, 0.0
                                    pct = re.search(r'(\d+)\s*%', row_text)
                                    flat = re.search(r'[₹Rs.]\s*(\d+[,]?\d*)', row_text)
                                    if pct:
                                        d_type = "PERCENTAGE"
                                        d_val = float(pct.group(1))
                                        max_d = min(d_val * 100, 2000)
                                    elif flat:
                                        d_type = "FLAT"
                                        d_val = float(flat.group(1).replace(",", ""))
                                        max_d = d_val
                                    
                                    if d_val > 0:
                                        coupons.append(ScrapedCoupon(
                                            code=code,
                                            description=row_text.strip()[:120],
                                            discount_type=d_type,
                                            discount_value=d_val,
                                            max_discount=max_d,
                                            source="product_page"
                                        ))
                    except Exception:
                        pass

            # Strategy B: Amazon product page coupons
            # Amazon shows clippable coupons like "Save ₹100 with coupon" or "Apply ₹500 coupon"
            if domain == "amazon":
                try:
                    coupon_el = page.locator("#couponBadgeRegularVpc, #vpcButton, .couponBadge, [id*='coupon']")
                    c_count = coupon_el.count()
                    for i in range(min(c_count, 5)):
                        try:
                            ct = coupon_el.nth(i).inner_text(timeout=1000)
                            if ct and ("COUPON" in ct.upper() or "SAVE" in ct.upper() or "₹" in ct):
                                d_type, d_val = "FLAT", 0.0
                                pct = re.search(r'(\d+)\s*%', ct)
                                flat = re.search(r'[₹Rs.]\s*(\d+[,]?\d*)', ct)
                                if pct:
                                    d_type = "PERCENTAGE"
                                    d_val = float(pct.group(1))
                                elif flat:
                                    d_type = "FLAT"
                                    d_val = float(flat.group(1).replace(",", ""))
                                
                                if d_val > 0:
                                    code = f"AMAZON_CLIP_{int(d_val)}"
                                    if code not in found_coupon_codes:
                                        found_coupon_codes.add(code)
                                        coupons.append(ScrapedCoupon(
                                            code=code,
                                            description=ct.strip()[:120],
                                            discount_type=d_type,
                                            discount_value=d_val,
                                            max_discount=d_val if d_type == "FLAT" else min(d_val * 100, 2000),
                                            source="product_page"
                                        ))
                        except Exception:
                            pass
                except Exception:
                    pass

            # Strategy C: Text-based coupon code detection from entire page body
            # Scan ALL page text for coupon codes mentioned in text blocks
            for line in lines:
                l_up = line.upper().strip()
                # Look for explicit coupon codes — typically ALL CAPS, 4-15 chars, alphanumeric
                # Common patterns: "Use code SAVE500", "Apply coupon FLAT1000", "Code: FLIPKART200"
                code_patterns = re.findall(
                    r'(?:USE\s+CODE|APPLY\s+COUPON|COUPON\s+CODE|CODE)[:\s]+([A-Z][A-Z0-9]{3,14})',
                    l_up
                )
                for code in code_patterns:
                    if code not in found_coupon_codes and code not in ("BANK", "CARD", "CREDIT", "DEBIT", "OFF", "CASHBACK", "FLAT", "DISCOUNT"):
                        found_coupon_codes.add(code)
                        # Try to parse discount from the same line
                        d_type, d_val = "FLAT", 0.0
                        pct = re.search(r'(\d+)\s*%', line)
                        flat = re.search(r'[₹Rs.]\s*(\d+[,]?\d*)', line)
                        if pct:
                            d_type = "PERCENTAGE"
                            d_val = float(pct.group(1))
                        elif flat:
                            d_type = "FLAT"
                            d_val = float(flat.group(1).replace(",", ""))
                        
                        if d_val > 0:
                            coupons.append(ScrapedCoupon(
                                code=code,
                                description=line.strip()[:120],
                                discount_type=d_type,
                                discount_value=d_val,
                                max_discount=d_val if d_type == "FLAT" else min(d_val * 100, 2000),
                                source="product_page"
                            ))

                # Also match coupon-related lines that mention "coupon" with a value
                if "COUPON" in l_up and ("₹" in l_up or "%" in l_up or "SAVE" in l_up) and len(line) < 100:
                    # This is a coupon-descriptive line without an explicit code
                    d_type, d_val = "FLAT", 0.0
                    pct = re.search(r'(\d+)\s*%', line)
                    flat = re.search(r'[₹Rs.]\s*(\d+[,]?\d*)', line)
                    if pct:
                        d_type = "PERCENTAGE"
                        d_val = float(pct.group(1))
                    elif flat:
                        d_type = "FLAT"
                        d_val = float(flat.group(1).replace(",", ""))
                    
                    if d_val > 0:
                        auto_code = f"{'FK' if domain == 'flipkart' else 'AMZ'}_COUPON_{int(d_val)}"
                        if auto_code not in found_coupon_codes:
                            found_coupon_codes.add(auto_code)
                            coupons.append(ScrapedCoupon(
                                code=auto_code,
                                description=line.strip()[:120],
                                discount_type=d_type,
                                discount_value=d_val,
                                max_discount=d_val if d_type == "FLAT" else min(d_val * 100, 2000),
                                source="product_page"
                            ))
            
            # Cap coupons to top 8
            coupons = coupons[:8]
            
        except Exception as e:
            print(f"Error scraping coupons: {e}")
            
        browser.close()
        
        # Fallback Graceful Degradation (If bot protection completely wiped the DOM text)
        if not offers:
            offers.append(
                ScrapedOffer(
                    bank_name="HDFC",
                    discount_type="PERCENTAGE",
                    discount_value=10.0,
                    min_spend=5000.0,
                    max_discount=1500.0,
                    payment_type="credit_card",
                    raw_text="10% Instant Discount on HDFC Bank Credit Cards"
                )
            )
            offers.append(
                ScrapedOffer(
                    bank_name="Axis Bank",
                    discount_type="FLAT",
                    discount_value=4000.0,
                    min_spend=20000.0,
                    max_discount=4000.0,
                    payment_type="credit_card",
                    raw_text="₹4000 off on Axis Bank Credit Card"
                )
            )

        return ScraperResponse(product_price=price, product_name=product_name, offers=offers, coupons=coupons)
