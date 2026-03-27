"""
External coupon scraper for CouponDunia and GrabOn.
Used as a fallback when the product-page scraper finds no coupons.

Includes product-aware filtering:
  • Category relevance (matches product name keywords to coupon descriptions)
  • Price eligibility (min_order_value check)
  • Expiry date parsing (filters out expired coupons)
  • Effective-discount ranking (picks the best coupon for the actual product price)
"""

import re
import httpx
from datetime import datetime
from typing import List, Optional
from app.models.scraper import ScrapedCoupon

# ── Product Category Keywords ────────────────────────────────────────
# Each category maps to keywords found in both product names AND coupon
# descriptions. If the product name contains any keyword from a category,
# coupons mentioning that same category are considered relevant.
CATEGORY_KEYWORDS = {
    "electronics": [
        "phone", "mobile", "smartphone", "laptop", "tablet", "tv", "television",
        "headphone", "earphone", "earbuds", "speaker", "camera", "monitor",
        "computer", "smart watch", "smartwatch", "charger", "power bank",
        "projector", "printer", "gaming", "console", "keyboard", "mouse",
    ],
    "fashion": [
        "shirt", "tshirt", "t-shirt", "jeans", "trouser", "dress", "kurta",
        "saree", "shoe", "sneaker", "sandal", "footwear", "jacket", "hoodie",
        "watch", "sunglasses", "bag", "backpack", "wallet", "belt", "cap",
        "clothing", "apparel", "fashion", "wear",
    ],
    "beauty": [
        "cream", "serum", "moisturizer", "lotion", "shampoo", "conditioner",
        "perfume", "deodorant", "makeup", "lipstick", "foundation", "mascara",
        "skincare", "beauty", "grooming", "face wash", "sunscreen", "hair",
    ],
    "home": [
        "furniture", "sofa", "bed", "mattress", "pillow", "curtain", "decor",
        "kitchen", "cookware", "mixer", "grinder", "blender", "iron", "fan",
        "cooler", "air conditioner", "ac", "refrigerator", "fridge",
        "washing machine", "microwave", "oven", "vacuum", "appliance",
    ],
    "grocery": [
        "grocery", "food", "snack", "biscuit", "rice", "oil", "dal", "atta",
        "milk", "bread", "fruit", "vegetable", "meat", "egg", "spice",
    ],
    "books": [
        "book", "novel", "textbook", "stationery", "pen", "notebook",
    ],
    "sports": [
        "sports", "fitness", "gym", "yoga", "cricket", "football",
        "badminton", "running", "shoes",
    ],
}

# Broad/"catch-all" coupon keywords — these apply to any product
UNIVERSAL_KEYWORDS = [
    "all", "sitewide", "everything", "any order", "all categories",
    "all products", "all orders", "entire", "store-wide",
]


# ── URL Mappings ─────────────────────────────────────────────────────
COUPONDUNIA_SLUGS = {
    "amazon":   "https://www.coupondunia.in/amazon",
    "flipkart": "https://www.coupondunia.in/flipkart",
    "myntra":   "https://www.coupondunia.in/myntra",
    "ajio":     "https://www.coupondunia.in/ajio",
    "nykaa":    "https://www.coupondunia.in/nykaa",
    "swiggy":   "https://www.coupondunia.in/swiggy",
    "zomato":   "https://www.coupondunia.in/zomato",
    "croma":    "https://www.coupondunia.in/croma",
    "jiomart":  "https://www.coupondunia.in/jiomart-coupons",
    "meesho":   "https://www.coupondunia.in/meesho",
}

GRABON_SLUGS = {
    "amazon":   "https://www.grabon.in/amazon-coupons/",
    "flipkart": "https://www.grabon.in/flipkart-coupons/",
    "myntra":   "https://www.grabon.in/myntra-coupons/",
    "ajio":     "https://www.grabon.in/ajio-coupons/",
    "nykaa":    "https://www.grabon.in/nykaa-coupons/",
    "swiggy":   "https://www.grabon.in/swiggy-coupons/",
    "zomato":   "https://www.grabon.in/zomato-coupons/",
    "croma":    "https://www.grabon.in/croma-coupons/",
    "jiomart":  "https://www.grabon.in/jiomart-coupons/",
    "meesho":   "https://www.grabon.in/meesho-coupons/",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
}

TIMEOUT = 10


# ── Helpers ──────────────────────────────────────────────────────────

def _identify_merchant(product_url: str) -> str | None:
    url_lower = product_url.lower()
    for key in COUPONDUNIA_SLUGS:
        if key in url_lower:
            return key
    return None


def _detect_product_categories(product_name: str) -> set[str]:
    """Return the set of category names that match the product."""
    name_lower = product_name.lower()
    matched = set()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in name_lower:
                matched.add(category)
                break
    return matched


def _is_coupon_relevant(
    coupon_desc: str,
    product_categories: set[str],
    product_name: str,
) -> bool:
    """
    Check whether a coupon description is relevant to the product.
    Returns True if:
      - Coupon is universal (mentions "all", "sitewide", etc.)
      - Coupon description mentions one of the product's categories
      - Coupon description contains a keyword from the product name
    """
    desc_lower = coupon_desc.lower()

    # Universal coupons apply to everything
    for kw in UNIVERSAL_KEYWORDS:
        if kw in desc_lower:
            return True

    # Category match
    for cat in product_categories:
        # Check if the category name itself appears
        if cat in desc_lower:
            return True
        # Check if any category keyword appears in coupon desc
        for kw in CATEGORY_KEYWORDS.get(cat, []):
            if kw in desc_lower:
                return True

    # Direct product-word match (take significant words from product name)
    name_words = set(
        w for w in product_name.lower().split()
        if len(w) > 3 and w not in {"with", "from", "this", "that", "more", "best", "only"}
    )
    for word in name_words:
        if word in desc_lower:
            return True

    return False


def _parse_expiry_from_text(text: str) -> Optional[datetime]:
    """
    Try to extract an expiry date from coupon description text.
    Common patterns:
      - "Valid till 31 Mar 2026"
      - "Expires on 15/04/2026"
      - "Offer ends 2026-03-31"
      - "Mar 2026"  (assume end of month)
    """
    t = text.strip()

    # Pattern: "31 Mar 2026", "15 April 2026"
    m = re.search(
        r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})',
        t, re.IGNORECASE,
    )
    if m:
        try:
            return datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}", "%d %b %Y")
        except ValueError:
            pass

    # Pattern: "Mar 2026" (no day → assume end of month)
    m = re.search(
        r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})',
        t, re.IGNORECASE,
    )
    if m:
        try:
            dt = datetime.strptime(f"1 {m.group(1)} {m.group(2)}", "%d %b %Y")
            # Move to last day of month
            if dt.month == 12:
                return dt.replace(month=12, day=31)
            return dt.replace(month=dt.month + 1, day=1)
        except ValueError:
            pass

    # Pattern: "15/04/2026" or "15-04-2026"
    m = re.search(r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})', t)
    if m:
        try:
            return datetime.strptime(f"{m.group(1)}/{m.group(2)}/{m.group(3)}", "%d/%m/%Y")
        except ValueError:
            pass

    return None


def _is_expired(coupon_desc: str) -> bool:
    """Check if coupon text mentions an expiry date that has already passed."""
    expiry = _parse_expiry_from_text(coupon_desc)
    if expiry and expiry < datetime.now():
        return True
    return False


def _effective_discount(coupon: ScrapedCoupon, product_price: float) -> float:
    """Calculate the actual ₹ savings this coupon gives on a specific price."""
    if product_price <= 0:
        return 0.0
    if coupon.min_order_value > 0 and product_price < coupon.min_order_value:
        return 0.0  # Not eligible

    if coupon.discount_type == "FLAT":
        discount = coupon.discount_value
    else:  # PERCENTAGE
        discount = product_price * (coupon.discount_value / 100)

    if coupon.max_discount > 0:
        discount = min(discount, coupon.max_discount)

    return min(discount, product_price)


# ── Parsers ──────────────────────────────────────────────────────────

def _parse_discount(text: str) -> tuple[str, float, float]:
    d_type = "FLAT"
    d_val = 0.0
    max_d = 0.0
    t = text.upper()

    pct = re.search(r'(\d+(?:\.\d+)?)\s*%', t)
    flat = re.search(r'(?:₹|RS\.?\s*)([\d,]+)', t)

    if pct:
        d_type = "PERCENTAGE"
        d_val = float(pct.group(1))
        cap = re.search(r'(?:UP\s*TO|MAX(?:IMUM)?)\s*(?:₹|RS\.?\s*)([\d,]+)', t)
        if cap:
            max_d = float(cap.group(1).replace(",", ""))
        else:
            max_d = min(d_val * 100, 5000)
    elif flat:
        d_type = "FLAT"
        d_val = float(flat.group(1).replace(",", ""))
        max_d = d_val

    return d_type, d_val, max_d


def _parse_min_order(text: str) -> float:
    t = text.upper()
    m = re.search(
        r'(?:MIN(?:IMUM)?\s*(?:ORDER|PURCHASE|SPEND|VALUE)?'
        r'[:\s]*(?:OF\s*)?(?:₹|RS\.?\s*)([\d,]+))',
        t,
    )
    if m:
        return float(m.group(1).replace(",", ""))
    m = re.search(r'(?:ABOVE|OVER)\s*(?:₹|RS\.?\s*)([\d,]+)', t)
    if m:
        return float(m.group(1).replace(",", ""))
    return 0.0


def _extract_coupon_code(text: str) -> str | None:
    m = re.search(
        r'(?:USE|APPLY|COUPON|PROMO|DISCOUNT)\s*(?:CODE)?[:\s]+([A-Z][A-Z0-9]{3,19})',
        text.upper(),
    )
    if m:
        code = m.group(1)
        exclusions = {
            "BANK", "CARD", "CREDIT", "DEBIT", "FLAT", "CASHBACK",
            "OFFER", "DISCOUNT", "COUPON", "ORDER", "ABOVE", "MORE",
            "DEALS", "SALE", "ONLINE", "SHOP", "FREE", "PRICE",
            "UPTO", "EXTRA", "PRODUCTS", "SAVE", "YOUR", "CODE",
            "WITH", "FROM", "THAT", "THIS", "WILL", "GRAB", "AVAIL",
            "STORE", "LANDING", "PAGE", "PAYMENT", "MINIMUM",
        }
        if code not in exclusions:
            return code
    return None


# ── Site Scrapers ────────────────────────────────────────────────────

def _scrape_site(merchant: str, slug_map: dict, source_name: str) -> List[ScrapedCoupon]:
    """Generic scraper for CouponDunia / GrabOn — fetches and parses."""
    url = slug_map.get(merchant)
    if not url:
        return []

    coupons: list[ScrapedCoupon] = []
    found_codes: set[str] = set()
    prefix = "CD" if source_name == "coupondunia" else "GO"

    try:
        with httpx.Client(headers=HEADERS, timeout=TIMEOUT, follow_redirects=True) as client:
            resp = client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as e:
        print(f"[{source_name}] Request failed for {merchant}: {e}")
        return []

    text = re.sub(r'<[^>]+>', '\n', html)
    text = re.sub(r'&[a-z]+;', ' ', text)
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    for line in lines:
        t = line.upper()
        has_discount = ("%" in t or "₹" in t or "RS " in t or "RS." in t)
        has_keyword = ("OFF" in t or "DISCOUNT" in t or "CASHBACK" in t or "SAVE" in t or "COUPON" in t)

        if not (has_discount and has_keyword):
            continue
        if len(line) < 15 or len(line) > 200:
            continue

        d_type, d_val, max_d = _parse_discount(line)
        if d_val <= 0:
            continue

        code = _extract_coupon_code(line)
        if not code:
            code = f"{prefix}_{merchant.upper()}_{d_type}_{int(d_val)}"

        if code in found_codes:
            continue
        found_codes.add(code)

        coupons.append(ScrapedCoupon(
            code=code,
            description=line[:150].strip(),
            discount_type=d_type,
            discount_value=d_val,
            min_order_value=_parse_min_order(line),
            max_discount=max_d,
            source=source_name,
        ))

        if len(coupons) >= 15:  # fetch more, we'll filter down later
            break

    return coupons


# ── Public API ───────────────────────────────────────────────────────

def scrape_external_coupons(
    product_url: str,
    product_name: str = "Unknown Product",
    product_price: float = 0.0,
) -> List[ScrapedCoupon]:
    """
    Scrape coupons from CouponDunia and GrabOn, then filter them for
    relevance to the specific product (by category, price, and expiry).

    Returns a list sorted by effective savings (best first), capped at 5.
    """
    merchant = _identify_merchant(product_url)
    if not merchant:
        print(f"[ExternalCoupons] Unknown merchant in URL: {product_url}")
        return []

    print(f"[ExternalCoupons] Scraping coupons for {merchant} | "
          f"product={product_name[:50]} | price={product_price}")

    # 1. Fetch raw coupons from both sources
    cd = _scrape_site(merchant, COUPONDUNIA_SLUGS, "coupondunia")
    go = _scrape_site(merchant, GRABON_SLUGS, "grabon")

    # Deduplicate
    seen: set[str] = set()
    raw: list[ScrapedCoupon] = []
    for c in cd + go:
        if c.code not in seen:
            seen.add(c.code)
            raw.append(c)

    print(f"[ExternalCoupons] Raw coupons fetched: {len(raw)}")

    # 2. Detect product categories
    categories = _detect_product_categories(product_name)
    print(f"[ExternalCoupons] Product categories detected: {categories or 'none (will match generics)'}")

    # 3. Filter
    filtered: list[ScrapedCoupon] = []
    for coupon in raw:
        # A. Expiry check
        if _is_expired(coupon.description):
            continue

        # B. Price eligibility — skip if product price is below min order
        if coupon.min_order_value > 0 and product_price > 0:
            if product_price < coupon.min_order_value:
                continue

        # C. Category relevance
        #    If we detected categories, filter by relevance.
        #    If no categories detected (unknown product), allow all.
        if categories and not _is_coupon_relevant(coupon.description, categories, product_name):
            continue

        filtered.append(coupon)

    print(f"[ExternalCoupons] After filtering: {len(filtered)} coupons")

    # 4. Rank by effective ₹ savings
    if product_price > 0:
        filtered.sort(
            key=lambda c: _effective_discount(c, product_price),
            reverse=True,
        )
    else:
        filtered.sort(key=lambda c: c.discount_value, reverse=True)

    # Cap at 5 — only the best relevant ones
    return filtered[:5]


def pick_best_coupon(
    coupons: List[ScrapedCoupon],
    product_price: float,
) -> Optional[ScrapedCoupon]:
    """
    From a list of already-filtered coupons, pick the single best one
    based on effective ₹ savings for the given product price.
    Returns None if no coupon is eligible.
    """
    if not coupons or product_price <= 0:
        return None

    best = None
    best_savings = 0.0

    for coupon in coupons:
        savings = _effective_discount(coupon, product_price)
        if savings > best_savings:
            best_savings = savings
            best = coupon

    return best


def filter_coupons_for_product(
    coupons: List[ScrapedCoupon],
    product_name: str,
    product_price: float,
) -> List[ScrapedCoupon]:
    """
    Filter ANY list of coupons (product-page or external) for relevance
    to a specific product. Re-usable by the main dynamic scraper.
    """
    if not coupons:
        return []

    categories = _detect_product_categories(product_name)
    filtered: list[ScrapedCoupon] = []

    for coupon in coupons:
        # Expiry check
        if _is_expired(coupon.description):
            continue

        # Price eligibility
        if coupon.min_order_value > 0 and product_price > 0:
            if product_price < coupon.min_order_value:
                continue

        # Category relevance (only if we can detect categories AND coupon is external)
        # Product-page coupons are always relevant as they came from the product itself
        if coupon.source != "product_page":
            if categories and not _is_coupon_relevant(coupon.description, categories, product_name):
                continue

        filtered.append(coupon)

    # Sort by effective savings
    if product_price > 0:
        filtered.sort(
            key=lambda c: _effective_discount(c, product_price),
            reverse=True,
        )

    return filtered
