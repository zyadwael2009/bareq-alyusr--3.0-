from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database import get_db
from app.models.user import User, UserType
from app.models.customer import Customer
from app.models.merchant import Merchant
from app.models.transaction import Transaction, TransactionStatus
from app.utils.security import verify_password, create_access_token, get_password_hash
from app.config import settings
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])


def verify_admin_token(authorization: str, db: Session) -> User:
    """Verify admin token and return admin user"""
    from app.utils.security import decode_token
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = int(payload.get("sub", 0))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or user.user_type != UserType.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user


@router.post("/create-admin", response_model=dict)
async def create_admin(
    email: str,
    password: str,
    full_name: str,
    secret_key: str,
    db: Session = Depends(get_db)
):
    """Create an admin user (requires secret key)"""
    if secret_key != settings.SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid secret key")
    
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    admin = User(
        email=email,
        phone_number="0000000000",
        full_name=full_name,
        hashed_password=get_password_hash(password),
        user_type=UserType.ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    return {
        "message": "Admin created successfully",
        "admin_id": admin.id,
        "email": admin.email
    }


@router.post("/login", response_model=dict)
async def admin_login(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    """Admin login"""
    user = db.query(User).filter(
        User.email == email,
        User.user_type == UserType.ADMIN
    ).first()
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "user_type": "admin"
    }
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }


@router.get("/dashboard", response_model=dict)
async def dashboard(
    authorization: str,
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    verify_admin_token(authorization, db)
    
    total_customers = db.query(Customer).count()
    approved_customers = db.query(Customer).filter(Customer.is_approved == True).count()
    pending_customers = db.query(Customer).filter(Customer.is_approved == False).count()
    
    total_merchants = db.query(Merchant).count()
    approved_merchants = db.query(Merchant).filter(Merchant.is_approved == True).count()
    pending_merchants = db.query(Merchant).filter(Merchant.is_approved == False).count()
    
    total_transactions = db.query(Transaction).count()
    pending_transactions = db.query(Transaction).filter(
        Transaction.status == TransactionStatus.PENDING
    ).count()
    approved_transactions = db.query(Transaction).filter(
        Transaction.status == TransactionStatus.APPROVED
    ).count()
    completed_transactions = db.query(Transaction).filter(
        Transaction.status == TransactionStatus.COMPLETED
    ).count()
    
    total_transaction_value = db.query(
        func.sum(Transaction.amount)
    ).filter(
        Transaction.status.in_([TransactionStatus.APPROVED, TransactionStatus.COMPLETED])
    ).scalar() or 0
    
    total_fees_collected = db.query(
        func.sum(Transaction.fee_amount)
    ).filter(
        Transaction.status.in_([TransactionStatus.APPROVED, TransactionStatus.COMPLETED])
    ).scalar() or 0
    
    return {
        "customers": {
            "total": total_customers,
            "approved": approved_customers,
            "pending": pending_customers
        },
        "merchants": {
            "total": total_merchants,
            "approved": approved_merchants,
            "pending": pending_merchants
        },
        "transactions": {
            "total": total_transactions,
            "pending": pending_transactions,
            "approved": approved_transactions,
            "completed": completed_transactions,
            "total_value": total_transaction_value,
            "total_fees": total_fees_collected
        }
    }


@router.get("/customers", response_model=list)
async def list_customers(
    authorization: str,
    is_approved: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List all customers"""
    verify_admin_token(authorization, db)
    
    query = db.query(Customer)
    if is_approved is not None:
        query = query.filter(Customer.is_approved == is_approved)
    
    customers = query.all()
    
    result = []
    for customer in customers:
        user = db.query(User).filter(User.id == customer.user_id).first()
        result.append({
            "id": customer.id,
            "user_id": customer.user_id,
            "full_name": user.full_name if user else None,
            "email": user.email if user else None,
            "phone_number": user.phone_number if user else None,
            "national_id": customer.national_id,
            "credit_limit": customer.credit_limit,
            "available_limit": customer.available_limit,
            "used_limit": customer.used_limit,
            "is_approved": customer.is_approved,
            "created_at": customer.created_at.isoformat() if customer.created_at else None
        })
    
    return result


@router.post("/customers/{customer_id}/approve", response_model=dict)
async def approve_customer(
    customer_id: int,
    authorization: str,
    db: Session = Depends(get_db)
):
    """Approve a customer"""
    verify_admin_token(authorization, db)
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.is_approved = True
    customer.approved_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Customer approved successfully", "customer_id": customer_id}


@router.put("/customers/{customer_id}/credit-limit", response_model=dict)
async def update_credit_limit(
    customer_id: int,
    credit_limit: float,
    authorization: str,
    db: Session = Depends(get_db)
):
    """Update customer credit limit"""
    verify_admin_token(authorization, db)
    
    if credit_limit < 0:
        raise HTTPException(status_code=400, detail="Invalid credit limit")
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    old_limit = customer.credit_limit
    difference = credit_limit - old_limit
    
    customer.credit_limit = credit_limit
    customer.available_limit += difference
    
    if customer.available_limit > customer.credit_limit:
        customer.available_limit = customer.credit_limit
    if customer.available_limit < 0:
        customer.available_limit = 0
    
    db.commit()
    
    return {
        "message": "Credit limit updated",
        "old_limit": old_limit,
        "new_limit": credit_limit,
        "available_limit": customer.available_limit
    }


@router.get("/merchants", response_model=list)
async def list_merchants(
    authorization: str,
    is_approved: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List all merchants"""
    verify_admin_token(authorization, db)
    
    query = db.query(Merchant)
    if is_approved is not None:
        query = query.filter(Merchant.is_approved == is_approved)
    
    merchants = query.all()
    
    result = []
    for merchant in merchants:
        user = db.query(User).filter(User.id == merchant.user_id).first()
        result.append({
            "id": merchant.id,
            "user_id": merchant.user_id,
            "full_name": user.full_name if user else None,
            "email": user.email if user else None,
            "phone_number": user.phone_number if user else None,
            "business_name": merchant.business_name,
            "commercial_registration": merchant.commercial_registration,
            "balance": merchant.balance,
            "total_earnings": merchant.total_earnings,
            "total_fees_paid": merchant.total_fees_paid,
            "is_approved": merchant.is_approved,
            "created_at": merchant.created_at.isoformat() if merchant.created_at else None
        })
    
    return result


@router.post("/merchants/{merchant_id}/approve", response_model=dict)
async def approve_merchant(
    merchant_id: int,
    authorization: str,
    db: Session = Depends(get_db)
):
    """Approve a merchant"""
    verify_admin_token(authorization, db)
    
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    merchant.is_approved = True
    merchant.approved_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Merchant approved successfully", "merchant_id": merchant_id}


@router.get("/transactions", response_model=list)
async def list_transactions(
    authorization: str,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List all transactions"""
    verify_admin_token(authorization, db)
    
    query = db.query(Transaction)
    if status:
        try:
            tx_status = TransactionStatus(status)
            query = query.filter(Transaction.status == tx_status)
        except ValueError:
            pass
    
    transactions = query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for tx in transactions:
        customer = db.query(Customer).filter(Customer.id == tx.customer_id).first()
        merchant = db.query(Merchant).filter(Merchant.id == tx.merchant_id).first()
        customer_user = db.query(User).filter(User.id == customer.user_id).first() if customer else None
        
        result.append({
            "id": tx.id,
            "reference_number": tx.reference_number,
            "customer_name": customer_user.full_name if customer_user else None,
            "merchant_name": merchant.business_name if merchant else None,
            "amount": tx.amount,
            "fee_amount": tx.fee_amount,
            "merchant_receives": tx.merchant_receives,
            "status": tx.status.value,
            "created_at": tx.created_at.isoformat() if tx.created_at else None,
            "approved_at": tx.approved_at.isoformat() if tx.approved_at else None
        })
    
    return result
