# StackSave — Smart Savings Assistant

**StackSave** automatically determines the best possible combination of coupon codes and credit card rewards for any given transaction. Stop losing money — stack your savings intelligently.

---

## 🏗️ Architecture

```
Frontend (React + Vite + Tailwind CSS)
         ↓ (REST API + JWT)
Backend (FastAPI)
         ↓ (SQL)
Supabase (PostgreSQL + Auth)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Supabase** project (free tier works)

### 1. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)  
2. Go to **SQL Editor** and run the contents of `supabase/migration.sql`
3. Copy your project credentials from **Settings → API**:
   - Project URL
   - Anon/public key
   - JWT Secret
   - Database connection string (Settings → Database)

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env with your Supabase credentials

# Seed database with demo data
python -m scripts.seed

# Start development server
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`  
API docs at `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Edit .env with your Supabase URL and anon key

# Start development server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/merchants` | No | List active merchants |
| GET | `/api/v1/cards` | Yes | List user's cards |
| POST | `/api/v1/cards` | Yes | Add a card |
| DELETE | `/api/v1/cards/{id}` | Yes | Delete a card |
| POST | `/api/v1/recommendation` | Yes | Get best savings combo |
| GET | `/api/v1/recommendations/history` | Yes | Recommendation history |

---

## 🧠 Recommendation Engine

The engine evaluates **every combination** of valid coupons × user cards:

1. Fetches valid coupons (active, not expired, min order met)
2. Fetches user's cards and merchant-specific rules
3. Applies coupon discount (FLAT / PERCENTAGE / CASHBACK)
4. Applies card reward (merchant rule → category rule → fallback)
5. Computes final price for each combination
6. Selects the combination with the lowest final price

**Tie-breaking**: higher savings → later coupon expiry → higher card cap

---

## 📦 Database Schema

- **merchants** — stores, categorized (E-Commerce, Food Delivery, etc.)
- **cards** — user credit/debit cards with fallback cashback rate
- **card_merchant_rules** — primary reward source (per-merchant/category multipliers)
- **coupons** — discount codes with FLAT/PERCENTAGE/CASHBACK types
- **recommendations** — saved results with full JSONB evaluation details

---

## 🔐 Authentication Flow

1. Frontend handles signup/login via Supabase Auth
2. JWT token is attached to all API requests
3. Backend validates JWT using `python-jose` with Supabase JWT secret
4. User ID is extracted from the `sub` claim
5. All protected routes use `Depends(get_current_user)`

---

## 🌱 Seed Data

Run `python -m scripts.seed` from the backend directory to populate:

- **Merchants**: Amazon, Flipkart, Swiggy, Zomato
- **Coupons**: 20% off (max ₹200), ₹150 flat, 10% cashback per merchant
- Cards and rules must be added after user registration

---

## 📁 Project Structure

```
StackSave/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry
│   │   ├── config.py         # Settings
│   │   ├── database.py       # DB connection
│   │   ├── dependencies.py   # JWT auth
│   │   ├── exceptions.py     # Error handling
│   │   ├── models/           # Pydantic schemas
│   │   ├── routers/          # API endpoints
│   │   └── services/         # Business logic
│   ├── scripts/seed.py       # Database seeder
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI
│   │   ├── contexts/         # Auth & Recommendation state
│   │   ├── lib/              # API & Supabase clients
│   │   └── pages/            # Route pages
│   └── package.json
└── supabase/
    └── migration.sql         # Database schema
```

---

## ⚖️ Rate Limiting

The recommendation endpoint is rate-limited to **30 requests per minute per IP** using `slowapi`.

---

## License

MIT
