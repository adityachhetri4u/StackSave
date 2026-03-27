from dotenv import load_dotenv
import os
load_dotenv()
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

try:
    response = supabase.table('merchants').select("*").execute()
    print("SUCCESS HTTP:", response.data)
except Exception as e:
    print("ERROR HTTP:", e)
