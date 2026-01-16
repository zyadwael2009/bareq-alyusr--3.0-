from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Tuple
from app.models.user import User, UserType
from app.models.customer import Customer
from app.models.merchant import Merchant
from app.utils.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    decode_token
)
from app.schemas.user import UserCreate, Token


class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_phone(self, phone_number: str) -> Optional[User]:
        """Get user by phone number"""
        return self.db.query(User).filter(User.phone_number == phone_number).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    def create_tokens(self, user: User) -> Token:
        """Create access and refresh tokens for user"""
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "user_type": user.user_type.value
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
    
    def refresh_tokens(self, refresh_token: str) -> Optional[Token]:
        """Refresh access token using refresh token"""
        payload = decode_token(refresh_token)
        
        if payload is None or payload.get("type") != "refresh":
            return None
        
        user_id = payload.get("sub")
        user = self.get_user_by_id(user_id)
        
        if user is None or not user.is_active:
            return None
        
        return self.create_tokens(user)
    
    def register_customer(
        self, 
        user_data: dict, 
        customer_data: dict
    ) -> Tuple[User, Customer]:
        """Register a new customer"""
        # Check if email or phone already exists
        if self.get_user_by_email(user_data["email"]):
            raise ValueError("Email already registered")
        if self.get_user_by_phone(user_data["phone_number"]):
            raise ValueError("Phone number already registered")
        
        # Check if national ID already exists
        existing_customer = self.db.query(Customer).filter(
            Customer.national_id == customer_data["national_id"]
        ).first()
        if existing_customer:
            raise ValueError("National ID already registered")
        
        # Create user
        user = User(
            email=user_data["email"],
            phone_number=user_data["phone_number"],
            full_name=user_data["full_name"],
            hashed_password=get_password_hash(user_data["password"]),
            user_type=UserType.CUSTOMER,
            is_active=True,
            is_verified=False
        )
        self.db.add(user)
        self.db.flush()  # Get user ID
        
        # Create customer profile
        customer = Customer(
            user_id=user.id,
            national_id=customer_data["national_id"],
            address=customer_data.get("address"),
            city=customer_data.get("city"),
            credit_limit=5000.0,
            available_limit=5000.0,
            used_limit=0.0,
            is_approved=True
        )
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(customer)
        
        return user, customer
    
    def register_merchant(
        self, 
        user_data: dict, 
        merchant_data: dict
    ) -> Tuple[User, Merchant]:
        """Register a new merchant"""
        # Check if email or phone already exists
        if self.get_user_by_email(user_data["email"]):
            raise ValueError("Email already registered")
        if self.get_user_by_phone(user_data["phone_number"]):
            raise ValueError("Phone number already registered")
        
        # Check if commercial registration already exists
        existing_merchant = self.db.query(Merchant).filter(
            Merchant.commercial_registration == merchant_data["commercial_registration"]
        ).first()
        if existing_merchant:
            raise ValueError("Commercial registration already registered")
        
        # Create user
        user = User(
            email=user_data["email"],
            phone_number=user_data["phone_number"],
            full_name=user_data["full_name"],
            hashed_password=get_password_hash(user_data["password"]),
            user_type=UserType.MERCHANT,
            is_active=True,
            is_verified=False
        )
        self.db.add(user)
        self.db.flush()  # Get user ID
        
        # Create merchant profile
        merchant = Merchant(
            user_id=user.id,
            business_name=merchant_data["business_name"],
            commercial_registration=merchant_data["commercial_registration"],
            tax_number=merchant_data.get("tax_number"),
            business_category=merchant_data.get("business_category"),
            business_address=merchant_data.get("business_address"),
            city=merchant_data.get("city"),
            bank_name=merchant_data.get("bank_name"),
            iban=merchant_data.get("iban"),
            balance=0.0,
            total_earnings=0.0,
            total_fees_paid=0.0,
            is_approved=True
        )
        self.db.add(merchant)
        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(merchant)
        
        return user, merchant
    
    def update_last_login(self, user: User) -> None:
        """Update user's last login time"""
        user.last_login = datetime.utcnow()
        self.db.commit()
