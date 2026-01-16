from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MerchantBase(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=255)
    commercial_registration: str = Field(..., min_length=5, max_length=50)
    tax_number: Optional[str] = None
    business_category: Optional[str] = None
    business_address: Optional[str] = None
    city: Optional[str] = None


class MerchantCreate(MerchantBase):
    """Additional fields when creating a merchant (used with UserCreate)"""
    bank_name: Optional[str] = None
    iban: Optional[str] = Field(None, min_length=15, max_length=34)


class MerchantUpdate(BaseModel):
    business_name: Optional[str] = Field(None, min_length=2, max_length=255)
    tax_number: Optional[str] = None
    business_category: Optional[str] = None
    business_address: Optional[str] = None
    city: Optional[str] = None
    bank_name: Optional[str] = None
    iban: Optional[str] = Field(None, min_length=15, max_length=34)


class MerchantResponse(BaseModel):
    id: int
    user_id: int
    business_name: str
    commercial_registration: str
    tax_number: Optional[str] = None
    business_category: Optional[str] = None
    balance: float
    total_earnings: float
    total_fees_paid: float
    bank_name: Optional[str] = None
    iban: Optional[str] = None
    business_address: Optional[str] = None
    city: Optional[str] = None
    is_approved: bool
    approved_at: Optional[datetime] = None
    created_at: datetime
    
    # Include user info
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None

    class Config:
        from_attributes = True


class MerchantBalance(BaseModel):
    """Merchant balance summary"""
    balance: float
    total_earnings: float
    total_fees_paid: float
    pending_transactions: int = 0
    completed_transactions: int = 0

    class Config:
        from_attributes = True
