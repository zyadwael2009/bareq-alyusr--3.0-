from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, Token, UserType
)
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.schemas.merchant import MerchantCreate, MerchantResponse
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register/customer", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_customer(
    email: str,
    phone_number: str,
    full_name: str,
    password: str,
    national_id: str,
    address: str = None,
    city: str = None,
    db: Session = Depends(get_db)
):
    """
    Register a new customer account.
    
    The customer account will need admin approval before they can make purchases.
    """
    auth_service = AuthService(db)
    
    try:
        user_data = {
            "email": email,
            "phone_number": phone_number,
            "full_name": full_name,
            "password": password
        }
        
        customer_data = {
            "national_id": national_id,
            "address": address,
            "city": city
        }
        
        user, customer = auth_service.register_customer(user_data, customer_data)
        
        return {
            "message": "Customer registered successfully. Awaiting admin approval.",
            "user_id": user.id,
            "customer_id": customer.id,
            "email": user.email
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/register/merchant", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_merchant(
    email: str,
    phone_number: str,
    full_name: str,
    password: str,
    business_name: str,
    commercial_registration: str,
    tax_number: str = None,
    business_category: str = None,
    business_address: str = None,
    city: str = None,
    bank_name: str = None,
    iban: str = None,
    db: Session = Depends(get_db)
):
    """
    Register a new merchant account.
    
    The merchant account will need admin approval before they can send purchase requests.
    """
    auth_service = AuthService(db)
    
    try:
        user_data = {
            "email": email,
            "phone_number": phone_number,
            "full_name": full_name,
            "password": password
        }
        
        merchant_data = {
            "business_name": business_name,
            "commercial_registration": commercial_registration,
            "tax_number": tax_number,
            "business_category": business_category,
            "business_address": business_address,
            "city": city,
            "bank_name": bank_name,
            "iban": iban
        }
        
        user, merchant = auth_service.register_merchant(user_data, merchant_data)
        
        return {
            "message": "Merchant registered successfully. Awaiting admin approval.",
            "user_id": user.id,
            "merchant_id": merchant.id,
            "email": user.email,
            "business_name": merchant.business_name
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=dict)
async def login(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    """
    Login for all users (customers and merchants).
    
    Returns JWT access and refresh tokens.
    """
    auth_service = AuthService(db)
    
    user = auth_service.authenticate_user(email, password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Update last login
    auth_service.update_last_login(user)
    
    # Create tokens
    tokens = auth_service.create_tokens(user)
    
    # Return tokens with user info
    return {
        "access_token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
        "token_type": tokens.token_type,
        "user": {
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "full_name": user.full_name,
            "user_type": user.user_type.value,
            "is_active": user.is_active,
            "is_verified": user.is_verified
        }
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    auth_service = AuthService(db)
    
    tokens = auth_service.refresh_tokens(refresh_token)
    
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return tokens


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's information.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        phone_number=current_user.phone_number,
        full_name=current_user.full_name,
        user_type=current_user.user_type.value,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )
