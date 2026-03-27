import os
from playwright.sync_api import sync_playwright
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
# Use Service Role Key to bypass RLS when inserting data from a backend script
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("WARNING: Supabase credentials not found in .env")

# Will store browser cookies and login session here so we don't have to login every time
USER_DATA_DIR = os.path.join(os.path.dirname(__file__), "user_data")

def get_persistent_context(headless=False):
    """
    Launch a persistent Chromium context to preserve cookies/logins.
    Returns the playwright instance and browser context.
    Make sure to call p.stop() when done.
    """
    p = sync_playwright().start()
    
    # Adding stealth-like arguments
    context = p.chromium.launch_persistent_context(
        user_data_dir=USER_DATA_DIR,
        headless=headless,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--window-size=1280,800"
        ],
        viewport={"width": 1280, "height": 800}
    )
    
    return p, context

def fetch_merchants():
    """Fetch active merchants to get their IDs for coupon linking."""
    if not supabase: return []
    resp = supabase.table("merchants").select("id, name").eq("is_active", True).execute()
    return resp.data

def submit_coupons(coupons_list):
    """
    Insert scraped coupons into the Supabase database using the REST API.
    This safely ignores network/port restrictions of Psycopg2.
    """
    if not supabase or not coupons_list:
        return
        
    try:
        # We process one by one to avoid duplicates if no unique constraint exists
        inserted = 0
        for coupon in coupons_list:
            # Check if exists
            exists = supabase.table("coupons").select("id").eq("merchant_id", coupon["merchant_id"]).eq("code", coupon["code"]).execute()
            
            if not exists.data:
                supabase.table("coupons").insert(coupon).execute()
                inserted += 1
                
        print(f"✅ Pre-calculated & stored {inserted} new coupons into Supabase database")
    except Exception as e:
        print(f"❌ Error inserting coupons: {e}")
