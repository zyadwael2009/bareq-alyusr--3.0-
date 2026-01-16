from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TransactionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    EXPIRED = "expired"


class TransactionCreate(BaseModel):
    """Merchant creates a transaction request for a customer"""
    customer_id: int
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    product_name: Optional[str] = None


class TransactionApproval(BaseModel):
    """Customer approves transaction and selects repayment plan"""
    transaction_id: int
    number_of_months: int = Field(..., ge=1, le=28)  # 1 to 28 months


class TransactionReject(BaseModel):
    """Customer rejects a transaction"""
    transaction_id: int
    reason: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    reference_number: str
    customer_id: int
    merchant_id: int
    amount: float
    fee_percentage: float
    fee_amount: float
    merchant_receives: float
    description: Optional[str] = None
    product_name: Optional[str] = None
    status: TransactionStatus
    created_at: datetime
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    # Related info
    customer_name: Optional[str] = None
    merchant_name: Optional[str] = None

    class Config:
        from_attributes = True


class TransactionList(BaseModel):
    transactions: List[TransactionResponse]
    total: int
    page: int
    per_page: int

    class Config:
        from_attributes = True


class TransactionSummary(BaseModel):
    """Summary of transaction for quick view"""
    reference_number: str
    amount: float
    status: TransactionStatus
    created_at: datetime
    other_party_name: str  # Customer name for merchant, merchant name for customer

    class Config:
        from_attributes = True
