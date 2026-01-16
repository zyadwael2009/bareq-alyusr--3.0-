# Bareq Al-Yusr - Buy Now Pay Later Platform

A comprehensive BNPL (Buy Now Pay Later) backend API built with **FastAPI** and **Flask**, using **SQLAlchemy** for database management.

## 🚀 Features

- **Customer Management**: Registration, credit limits, account approval
- **Merchant Management**: Registration, balance tracking, transaction history
- **Transaction System**: Merchants send purchase requests, customers approve/reject
- **Flexible Repayment**: 1-28 month repayment options
- **Credit Limit System**: Available limit decreases on purchase, restores on repayment
- **0.5% Transaction Fee**: Automatically deducted from merchant payments
- **JWT Authentication**: Secure API access for all user types
- **Admin Dashboard**: Flask-based admin API for management

## 📁 Project Structure

```
bareq-alyusr/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI main application
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database setup
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── customer.py
│   │   ├── merchant.py
│   │   ├── transaction.py
│   │   └── repayment_plan.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   ├── customer.py
│   │   ├── merchant.py
│   │   ├── transaction.py
│   │   └── repayment.py
│   ├── routers/             # API endpoints
│   │   ├── auth.py
│   │   ├── customers.py
│   │   ├── merchants.py
│   │   ├── transactions.py
│   │   └── repayments.py
│   ├── services/            # Business logic
│   │   ├── auth_service.py
│   │   ├── customer_service.py
│   │   ├── merchant_service.py
│   │   ├── transaction_service.py
│   │   └── repayment_service.py
│   └── utils/               # Utilities
│       ├── security.py
│       └── dependencies.py
├── flask_admin/             # Flask admin dashboard
│   ├── __init__.py
│   └── app.py
├── requirements.txt
├── .env
├── .env.example
├── run.py                   # Run both servers
└── README.md
```

## 🛠️ Installation

### 1. Clone and Navigate
```bash
cd bareq-alyusr
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

### 5. Run the Application

**Option 1: Run Both Servers**
```bash
python run.py
```

**Option 2: Run Separately**
```bash
# Terminal 1 - FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Flask Admin
python flask_admin/app.py
```

## 📚 API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Flask Admin**: http://localhost:5000

## 🔐 API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/customer` | Register a new customer |
| POST | `/register/merchant` | Register a new merchant |
| POST | `/login` | Login (returns JWT tokens) |
| POST | `/refresh` | Refresh access token |
| GET | `/me` | Get current user info |

### Customers (`/api/v1/customers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get customer profile |
| GET | `/me/limit` | Get credit limit info |
| PUT | `/me` | Update profile |
| GET | `/me/pending-transactions` | Get pending transactions |
| GET | `/me/repayment-plans` | Get all repayment plans |

### Merchants (`/api/v1/merchants`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get merchant profile |
| GET | `/me/balance` | Get balance info |
| PUT | `/me` | Update profile |
| GET | `/me/transactions` | Get all transactions |
| GET | `/search-customer` | Search customer by phone |

### Transactions (`/api/v1/transactions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create transaction (merchant) |
| POST | `/{id}/approve` | Approve transaction (customer) |
| POST | `/{id}/reject` | Reject transaction (customer) |
| POST | `/{id}/cancel` | Cancel transaction (merchant) |
| GET | `/{id}` | Get transaction details |
| GET | `/{id}/repayment-plan` | Get repayment plan |

### Repayments (`/api/v1/repayments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans` | Get all repayment plans |
| GET | `/plans/{id}` | Get specific plan |
| POST | `/plans/{id}/pay` | Make a payment |
| GET | `/plans/{id}/next-payment` | Get next payment due |
| GET | `/overdue` | Get overdue payments |

### Admin Endpoints (Flask - port 5000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/login` | Admin login |
| GET | `/admin/dashboard` | Get dashboard stats |
| GET | `/admin/customers` | List customers |
| POST | `/admin/customers/{id}/approve` | Approve customer |
| PUT | `/admin/customers/{id}/credit-limit` | Update credit limit |
| GET | `/admin/merchants` | List merchants |
| POST | `/admin/merchants/{id}/approve` | Approve merchant |
| GET | `/admin/transactions` | List transactions |

## 📖 Transaction Flow

### 1. Registration
```
Customer/Merchant → Register → Await Admin Approval
```

### 2. Admin Approval
```
Admin → Approve Customer/Merchant
Admin → Set Customer Credit Limit (e.g., 10,000 SAR)
```

### 3. Purchase Flow
```
Merchant → Search Customer by Phone
Merchant → Create Transaction Request
Customer → Receives Pending Transaction
Customer → Approves (selects 1-28 months) or Rejects
```

### 4. On Approval
```
Customer's Available Limit: Decreases by purchase amount
Merchant's Balance: Increases by (amount - 0.5% fee)
Repayment Plan: Created with monthly schedule
```

### 5. Repayment
```
Customer → Makes Monthly Payment
Customer's Available Limit: Increases by payment amount
When Fully Paid → Transaction marked as Completed
```

## 💰 Fee Structure

- **Transaction Fee**: 0.5% of purchase amount
- **Example**: 
  - Purchase: 1,000 SAR
  - Fee: 5 SAR
  - Merchant Receives: 995 SAR

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Role-based access control (Customer, Merchant, Admin)
- Account approval system

## 📊 Database Schema

### Users
- Base user with email, phone, password, type

### Customers
- Linked to User
- Credit limit, available limit, used limit
- National ID for verification

### Merchants
- Linked to User
- Business info, commercial registration
- Balance, earnings, fees paid

### Transactions
- Reference number, amount, fee
- Status: pending, approved, rejected, cancelled, completed, expired
- Links customer and merchant

### Repayment Plans
- Linked to transaction
- Number of months, monthly payment
- Payment schedules with due dates

## 🚀 Production Deployment

1. Use PostgreSQL instead of SQLite
2. Set strong SECRET_KEY
3. Configure proper CORS origins
4. Use HTTPS
5. Set DEBUG=False
6. Use gunicorn/uvicorn workers

## 📝 License

MIT License
