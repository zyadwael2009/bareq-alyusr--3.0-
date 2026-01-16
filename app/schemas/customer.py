from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    national_id: str = Field(..., min_length=10, max_length=20)
    address: Optional[str] = None
    city: Optional[str] = None


class CustomerCreate(CustomerBase):
    """Additional fields when creating a customer (used with UserCreate)"""
    pass


class CustomerUpdate(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None


class CreditLimitUpdate(BaseModel):
    """Used by admin to update customer's credit limit"""
    credit_limit: float = Field(..., ge=0)
    reason: Optional[str] = None  # Reason for the change


class CustomerResponse(BaseModel):
    id: int
    user_id: int
    national_id: str
    credit_limit: float
    available_limit: float
    used_limit: float
    address: Optional[str] = None
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


class CustomerWithLimitInfo(BaseModel):
    """Detailed customer info with limit breakdown"""
    id: int
    full_name: str
    credit_limit: float
    available_limit: float
    used_limit: float
    is_approved: bool
    pending_transactions: int = 0
    active_repayment_plans: int = 0

    class Config:
        from_attributes = True
