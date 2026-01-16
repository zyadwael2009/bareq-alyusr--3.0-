from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    PARTIALLY_PAID = "partially_paid"
    PAYMENT_REQUESTED = "payment_requested"


class RepaymentPlanCreate(BaseModel):
    """Created when customer approves a transaction"""
    transaction_id: int
    number_of_months: int = Field(..., ge=1, le=28)


class RepaymentScheduleResponse(BaseModel):
    id: int
    installment_number: int
    due_date: datetime
    amount: float
    amount_paid: float
    status: PaymentStatus
    paid_at: Optional[datetime] = None
    payment_reference: Optional[str] = None

    class Config:
        from_attributes = True


class RepaymentPlanResponse(BaseModel):
    id: int
    transaction_id: int
    customer_id: int
    total_amount: float
    number_of_months: int
    monthly_payment: float
    total_paid: float
    remaining_amount: float
    payments_made: int
    payments_remaining: int
    status: PaymentStatus
    start_date: datetime
    end_date: datetime
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    # Include schedule
    schedules: List[RepaymentScheduleResponse] = []
    
    # Transaction reference
    transaction_reference: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    """Make a payment on a repayment schedule"""
    repayment_plan_id: int
    schedule_id: int  # Which installment to pay
    amount: float = Field(..., gt=0)
    payment_reference: Optional[str] = None


class PaymentResponse(BaseModel):
    success: bool
    message: str
    amount_paid: float
    remaining_for_installment: float
    total_remaining: float
    schedule_status: PaymentStatus
    plan_status: PaymentStatus
    limit_restored: float  # How much limit was restored

    class Config:
        from_attributes = True


class RepaymentPlanSummary(BaseModel):
    """Summary of repayment plan"""
    id: int
    transaction_reference: str
    total_amount: float
    monthly_payment: float
    payments_made: int
    payments_remaining: int
    next_payment_date: Optional[datetime] = None
    next_payment_amount: Optional[float] = None
    status: PaymentStatus

    class Config:
        from_attributes = True
