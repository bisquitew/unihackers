import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def test_connection():
    print(f"Connecting to: {SUPABASE_URL}")
    try:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing in .env")
            return

        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Fetch all rows from parking_lots to verify data
        response = supabase.table("parking_lots").select("*").execute()
        
        if response.data:
            print(f"✅ Success! Found {len(response.data)} lots in the database:")
            for lot in response.data:
                print(f"   - ID: {lot['id']} | Capacity: {lot['capacity']} | Available: {lot['available_spots']}")
        else:
            print("✅ Connected, but the 'parking_lots' table appears to be empty.")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    test_connection()
