from flask import Flask, jsonify, request, session
from flask_cors import CORS
from functools import wraps
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.database import SessionLocal
from app.models.user import User, UserType
from app.models.customer import Customer
from app.models.merchant import Merchant
from app.models.transaction import Transaction, TransactionStatus
from app.models.repayment_plan import RepaymentPlan, RepaymentSchedule, PaymentStatus
from app.utils.security import verify_password, create_access_token, decode_token, get_password_hash
from datetime import datetime

# Create Flask app
flask_app = Flask(__name__)
flask_app.secret_key = settings.FLASK_SECRET_KEY
CORS(flask_app)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # Don't close here, will be handled by caller


def require_admin(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({"error": "No token provided"}), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid token"}), 401
        
        if payload.get("user_type") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        return f(*args, **kwargs)
    return decorated_function


# ============ Admin Authentication ============

@flask_app.route('/admin/login', methods=['POST'])
def admin_login():
    """Admin login"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    db = get_db()
    try:
        user = db.query(User).filter(
            User.email == email,
            User.user_type == UserType.ADMIN
        ).first()
        
        if not user or not verify_password(password, user.hashed_password):
            return jsonify({"error": "Invalid credentials"}), 401
        
        token_data = {
            "sub": user.id,
            "email": user.email,
            "user_type": "admin"
        }
        access_token = create_access_token(token_data)
        
        return jsonify({
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name
            }
        })
    finally:
        db.close()


# ============ Dashboard ============

@flask_app.route('/admin/dashboard', methods=['GET'])
@require_admin
def dashboard():
    """Get admin dashboard statistics"""
    db = get_db()
    try:
        # Count statistics
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
        
        # Calculate total transaction value
        from sqlalchemy import func
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
        
        return jsonify({
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
        })
    finally:
        db.close()


# ============ Customer Management ============

@flask_app.route('/admin/customers', methods=['GET'])
@require_admin
def list_customers():
    """List all customers"""
    db = get_db()
    try:
        is_approved = request.args.get('is_approved')
        
        query = db.query(Customer)
        if is_approved is not None:
            query = query.filter(Customer.is_approved == (is_approved.lower() == 'true'))
        
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
        
        return jsonify(result)
    finally:
        db.close()


@flask_app.route('/admin/customers/<int:customer_id>/approve', methods=['POST'])
@require_admin
def approve_customer(customer_id):
    """Approve a customer"""
    db = get_db()
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        
        if not customer:
            return jsonify({"error": "Customer not found"}), 404
        
        customer.is_approved = True
        customer.approved_at = datetime.utcnow()
        db.commit()
        
        return jsonify({"message": "Customer approved successfully"})
    finally:
        db.close()


@flask_app.route('/admin/customers/<int:customer_id>/credit-limit', methods=['PUT'])
@require_admin
def update_credit_limit(customer_id):
    """Update customer credit limit"""
    db = get_db()
    try:
        data = request.get_json()
        new_limit = data.get('credit_limit')
        
        if new_limit is None or new_limit < 0:
            return jsonify({"error": "Invalid credit limit"}), 400
        
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        
        if not customer:
            return jsonify({"error": "Customer not found"}), 404
        
        old_limit = customer.credit_limit
        difference = new_limit - old_limit
        
        customer.credit_limit = new_limit
        customer.available_limit += difference
        
        if customer.available_limit > customer.credit_limit:
            customer.available_limit = customer.credit_limit
        if customer.available_limit < 0:
            customer.available_limit = 0
        
        db.commit()
        
        return jsonify({
            "message": "Credit limit updated",
            "old_limit": old_limit,
            "new_limit": new_limit,
            "available_limit": customer.available_limit
        })
    finally:
        db.close()


# ============ Merchant Management ============

@flask_app.route('/admin/merchants', methods=['GET'])
@require_admin
def list_merchants():
    """List all merchants"""
    db = get_db()
    try:
        is_approved = request.args.get('is_approved')
        
        query = db.query(Merchant)
        if is_approved is not None:
            query = query.filter(Merchant.is_approved == (is_approved.lower() == 'true'))
        
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
        
        return jsonify(result)
    finally:
        db.close()


@flask_app.route('/admin/merchants/<int:merchant_id>/approve', methods=['POST'])
@require_admin
def approve_merchant(merchant_id):
    """Approve a merchant"""
    db = get_db()
    try:
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
        
        if not merchant:
            return jsonify({"error": "Merchant not found"}), 404
        
        merchant.is_approved = True
        merchant.approved_at = datetime.utcnow()
        db.commit()
        
        return jsonify({"message": "Merchant approved successfully"})
    finally:
        db.close()


# ============ Transaction Management ============

@flask_app.route('/admin/transactions', methods=['GET'])
@require_admin
def list_transactions():
    """List all transactions"""
    db = get_db()
    try:
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
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
        
        return jsonify(result)
    finally:
        db.close()


# ============ Create Admin User ============

@flask_app.route('/admin/create-admin', methods=['POST'])
def create_admin():
    """Create an admin user (should be disabled in production or protected)"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    secret_key = data.get('secret_key')
    
    # Simple protection - require a secret key
    if secret_key != settings.SECRET_KEY:
        return jsonify({"error": "Invalid secret key"}), 403
    
    if not all([email, password, full_name]):
        return jsonify({"error": "All fields required"}), 400
    
    db = get_db()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return jsonify({"error": "Email already exists"}), 400
        
        admin = User(
            email=email,
            phone_number="0000000000",  # Placeholder
            full_name=full_name,
            hashed_password=get_password_hash(password),
            user_type=UserType.ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        return jsonify({
            "message": "Admin created successfully",
            "admin_id": admin.id,
            "email": admin.email
        }), 201
    finally:
        db.close()


@flask_app.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        "message": "Bareq Al-Yusr Admin API",
        "endpoints": {
            "login": "/admin/login",
            "dashboard": "/admin/dashboard",
            "customers": "/admin/customers",
            "merchants": "/admin/merchants",
            "transactions": "/admin/transactions"
        }
    })


if __name__ == '__main__':
    flask_app.run(
        host='0.0.0.0',
        port=settings.FLASK_PORT,
        debug=settings.DEBUG
    )
