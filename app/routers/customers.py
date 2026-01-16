from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.services.customer_service import CustomerService
from app.services.transaction_service import TransactionService
from app.services.repayment_service import RepaymentService
from app.schemas.customer import CustomerResponse, CustomerUpdate, CreditLimitUpdate
from app.schemas.transaction import TransactionResponse, TransactionApproval
from app.schemas.repayment import RepaymentPlanResponse
from app.utils.dependencies import (
    get_current_user, 
    get_current_customer,
    get_current_admin,
    require_approved_customer
)
from app.models.user import User
from app.models.customer import Customer

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("/me", response_model=CustomerResponse)
async def get_my_profile(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get current customer's profile information.
    """
    user = db.query(User).filter(User.id == customer.user_id).first()
    
    return CustomerResponse(
        id=customer.id,
        user_id=customer.user_id,
        national_id=customer.national_id,
        credit_limit=customer.credit_limit,
        available_limit=customer.available_limit,
        used_limit=customer.used_limit,
        address=customer.address,
        city=customer.city,
        is_approved=customer.is_approved,
        approved_at=customer.approved_at,
        created_at=customer.created_at,
        full_name=user.full_name if user else None,
        email=user.email if user else None,
        phone_number=user.phone_number if user else None
    )


@router.get("/me/limit", response_model=dict)
async def get_my_credit_limit(
    customer: Customer = Depends(get_current_customer)
):
    """
    Get current customer's credit limit information.
    """
    return {
        "credit_limit": customer.credit_limit,
        "available_limit": customer.available_limit,
        "used_limit": customer.used_limit,
        "is_approved": customer.is_approved
    }


@router.put("/me", response_model=CustomerResponse)
async def update_my_profile(
    address: str = None,
    city: str = None,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Update current customer's profile.
    """
    customer_service = CustomerService(db)
    updated_customer = customer_service.update_customer_profile(
        customer,
        address=address,
        city=city
    )
    
    user = db.query(User).filter(User.id == customer.user_id).first()
    
    return CustomerResponse(
        id=updated_customer.id,
        user_id=updated_customer.user_id,
        national_id=updated_customer.national_id,
        credit_limit=updated_customer.credit_limit,
        available_limit=updated_customer.available_limit,
        used_limit=updated_customer.used_limit,
        address=updated_customer.address,
        city=updated_customer.city,
        is_approved=updated_customer.is_approved,
        approved_at=updated_customer.approved_at,
        created_at=updated_customer.created_at,
        full_name=user.full_name if user else None,
        email=user.email if user else None,
        phone_number=user.phone_number if user else None
    )


@router.get("/me/pending-transactions", response_model=List[TransactionResponse])
async def get_my_pending_transactions(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get pending transactions waiting for customer approval.
    """
    tx_service = TransactionService(db)
    transactions = tx_service.get_pending_transactions_for_customer(customer.id)
    
    responses = []
    for tx in transactions:
        # Get merchant info
        from app.models.merchant import Merchant
        merchant = db.query(Merchant).filter(Merchant.id == tx.merchant_id).first()
        merchant_user = db.query(User).filter(User.id == merchant.user_id).first() if merchant else None
        
        responses.append(TransactionResponse(
            id=tx.id,
            reference_number=tx.reference_number,
            customer_id=tx.customer_id,
            merchant_id=tx.merchant_id,
            amount=tx.amount,
            fee_percentage=tx.fee_percentage,
            fee_amount=tx.fee_amount,
            merchant_receives=tx.merchant_receives,
            description=tx.description,
            product_name=tx.product_name,
            status=tx.status.value,
            created_at=tx.created_at,
            approved_at=tx.approved_at,
            expires_at=tx.expires_at,
            merchant_name=merchant.business_name if merchant else None
        ))
    
    return responses


@router.get("/me/repayment-plans", response_model=List[RepaymentPlanResponse])
async def get_my_repayment_plans(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get all repayment plans for the current customer.
    """
    repayment_service = RepaymentService(db)
    plans = repayment_service.get_customer_repayment_plans(customer.id)
    
    responses = []
    for plan in plans:
        responses.append(RepaymentPlanResponse(
            id=plan.id,
            transaction_id=plan.transaction_id,
            customer_id=plan.customer_id,
            total_amount=plan.total_amount,
            number_of_months=plan.number_of_months,
            monthly_payment=plan.monthly_payment,
            total_paid=plan.total_paid,
            remaining_amount=plan.remaining_amount,
            payments_made=plan.payments_made,
            payments_remaining=plan.payments_remaining,
            status=plan.status.value,
            start_date=plan.start_date,
            end_date=plan.end_date,
            created_at=plan.created_at,
            completed_at=plan.completed_at,
            transaction_reference=plan.transaction.reference_number if plan.transaction else None,
            schedules=[{
                "id": s.id,
                "installment_number": s.installment_number,
                "due_date": s.due_date,
                "amount": s.amount,
                "amount_paid": s.amount_paid,
                "status": s.status.value,
                "paid_at": s.paid_at,
                "payment_reference": s.payment_reference
            } for s in plan.schedules]
        ))
    
    return responses


# ============ Admin Endpoints ============

@router.get("/", response_model=List[CustomerResponse])
async def list_all_customers(
    is_approved: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    List all customers (Admin only).
    """
    customer_service = CustomerService(db)
    customers = customer_service.get_all_customers(
        is_approved=is_approved,
        limit=limit,
        offset=offset
    )
    
    responses = []
    for customer in customers:
        user = db.query(User).filter(User.id == customer.user_id).first()
        responses.append(CustomerResponse(
            id=customer.id,
            user_id=customer.user_id,
            national_id=customer.national_id,
            credit_limit=customer.credit_limit,
            available_limit=customer.available_limit,
            used_limit=customer.used_limit,
            address=customer.address,
            city=customer.city,
            is_approved=customer.is_approved,
            approved_at=customer.approved_at,
            created_at=customer.created_at,
            full_name=user.full_name if user else None,
            email=user.email if user else None,
            phone_number=user.phone_number if user else None
        ))
    
    return responses


@router.post("/{customer_id}/approve", response_model=dict)
async def approve_customer(
    customer_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Approve a customer account (Admin only).
    """
    customer_service = CustomerService(db)
    customer = customer_service.get_customer_by_id(customer_id)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    if customer.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer is already approved"
        )
    
    customer_service.approve_customer(customer)
    
    return {
        "message": "Customer approved successfully",
        "customer_id": customer_id
    }


@router.put("/{customer_id}/credit-limit", response_model=dict)
async def update_customer_credit_limit(
    customer_id: int,
    credit_limit: float,
    reason: str = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update customer's credit limit (Admin only).
    
    This affects both the total credit limit and available limit.
    """
    customer_service = CustomerService(db)
    customer = customer_service.get_customer_by_id(customer_id)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    old_limit = customer.credit_limit
    
    try:
        updated_customer = customer_service.update_credit_limit(
            customer,
            credit_limit,
            reason
        )
        
        return {
            "message": "Credit limit updated successfully",
            "customer_id": customer_id,
            "old_limit": old_limit,
            "new_limit": updated_customer.credit_limit,
            "available_limit": updated_customer.available_limit,
            "reason": reason
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
