import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
MIGRATION_FILE = os.path.join("..", "supabase", "migration.sql")

def run_migration():
    print(f"Connecting to {DATABASE_URL}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        with open(MIGRATION_FILE, "r") as f:
            sql = f.read()
            
        print("Executing migration.sql...")
        cursor.execute(sql)
        print("Migration executed successfully!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error executing migration: {e}")

if __name__ == "__main__":
    run_migration()
