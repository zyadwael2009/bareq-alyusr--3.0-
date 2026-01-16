from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.services.transaction_service import TransactionService
from app.services.repayment_service import RepaymentService
from app.schemas.transaction import (
    TransactionCreate, TransactionResponse, TransactionApproval
)
from app.schemas.repayment import RepaymentPlanResponse
from app.utils.dependencies import (
    get_current_user,
    get_current_customer,
    get_current_merchant,
    require_approved_customer,
    require_approved_merchant
)
from app.models.user import User
from app.models.customer import Customer
from app.models.merchant import Merchant
from app.models.transaction import TransactionStatus

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    customer_id: int,
    amount: float,
    description: str = None,
    product_name: str = None,
    merchant: Merchant = Depends(require_approved_merchant),
    db: Session = Depends(get_db)
):
    """
    Merchant sends a purchase request to a customer.
    
    The customer will receive this request and can approve or reject it.
    A 0.5% fee will be deducted from the amount when the transaction is approved.
    """
    tx_service = TransactionService(db)
    
    try:
        transaction = tx_service.create_transaction(
            merchant=merchant,
            customer_id=customer_id,
            amount=amount,
            description=description,
            product_name=product_name
        )
        
        customer_user = db.query(User).join(
            Customer, Customer.user_id == User.id
        ).filter(Customer.id == transaction.customer_id).first()
        
        return TransactionResponse(
            id=transaction.id,
            reference_number=transaction.reference_number,
            customer_id=transaction.customer_id,
            merchant_id=transaction.merchant_id,
            amount=transaction.amount,
            fee_percentage=transaction.fee_percentage,
            fee_amount=transaction.fee_amount,
            merchant_receives=transaction.merchant_receives,
            description=transaction.description,
            product_name=transaction.product_name,
            status=transaction.status.value,
            created_at=transaction.created_at,
            expires_at=transaction.expires_at,
            customer_name=customer_user.full_name if customer_user else None
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{transaction_id}/approve", response_model=dict)
async def approve_transaction(
    transaction_id: int,
    number_of_months: int,
    customer: Customer = Depends(require_approved_customer),
    db: Session = Depends(get_db)
):
    """
    Customer approves a transaction and selects repayment plan.
    
    - number_of_months: How many months to repay (1-28)
    - Customer's available limit will be reduced
    - Merchant will receive the payment (minus 0.5% fee)
    - A repayment plan will be created
    """
    if number_of_months < 1 or number_of_months > 28:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of months must be between 1 and 28"
        )
    
    tx_service = TransactionService(db)
    repayment_service = RepaymentService(db)
    
    transaction = tx_service.get_transaction_by_id(transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    try:
        # Approve the transaction
        approved_tx = tx_service.approve_transaction(transaction, customer)
        
        # Create repayment plan
        repayment_plan = repayment_service.create_repayment_plan(
            transaction=approved_tx,
            customer=customer,
            number_of_months=number_of_months
        )
        
        return {
            "message": "Transaction approved successfully",
            "transaction_id": transaction_id,
            "reference_number": approved_tx.reference_number,
            "amount": approved_tx.amount,
            "repayment_plan": {
                "id": repayment_plan.id,
                "number_of_months": repayment_plan.number_of_months,
                "monthly_payment": repayment_plan.monthly_payment,
                "first_payment_date": repayment_plan.start_date.isoformat(),
                "last_payment_date": repayment_plan.end_date.isoformat()
            },
            "new_available_limit": customer.available_limit
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{transaction_id}/reject", response_model=dict)
async def reject_transaction(
    transaction_id: int,
    reason: str = None,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Customer rejects a transaction.
    """
    tx_service = TransactionService(db)
    
    transaction = tx_service.get_transaction_by_id(transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    try:
        rejected_tx = tx_service.reject_transaction(transaction, customer, reason)
        
        return {
            "message": "Transaction rejected",
            "transaction_id": transaction_id,
            "reference_number": rejected_tx.reference_number
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{transaction_id}/cancel", response_model=dict)
async def cancel_transaction(
    transaction_id: int,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Merchant cancels a pending transaction.
    """
    tx_service = TransactionService(db)
    
    transaction = tx_service.get_transaction_by_id(transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    try:
        cancelled_tx = tx_service.cancel_transaction(transaction, merchant)
        
        return {
            "message": "Transaction cancelled",
            "transaction_id": transaction_id,
            "reference_number": cancelled_tx.reference_number
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get transaction details.
    
    Only the customer or merchant involved in the transaction can view it.
    """
    tx_service = TransactionService(db)
    
    transaction = tx_service.get_transaction_by_id(transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Check if user has access to this transaction
    if current_user.customer:
        if transaction.customer_id != current_user.customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this transaction"
            )
    elif current_user.merchant:
        if transaction.merchant_id != current_user.merchant.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this transaction"
            )
    
    # Get names
    customer_user = db.query(User).join(
        Customer, Customer.user_id == User.id
    ).filter(Customer.id == transaction.customer_id).first()
    
    merchant_user = db.query(User).join(
        Merchant, Merchant.user_id == User.id
    ).filter(Merchant.id == transaction.merchant_id).first()
    
    return TransactionResponse(
        id=transaction.id,
        reference_number=transaction.reference_number,
        customer_id=transaction.customer_id,
        merchant_id=transaction.merchant_id,
        amount=transaction.amount,
        fee_percentage=transaction.fee_percentage,
        fee_amount=transaction.fee_amount,
        merchant_receives=transaction.merchant_receives,
        description=transaction.description,
        product_name=transaction.product_name,
        status=transaction.status.value,
        created_at=transaction.created_at,
        approved_at=transaction.approved_at,
        rejected_at=transaction.rejected_at,
        completed_at=transaction.completed_at,
        expires_at=transaction.expires_at,
        customer_name=customer_user.full_name if customer_user else None,
        merchant_name=merchant_user.full_name if merchant_user else None
    )


@router.get("/{transaction_id}/repayment-plan", response_model=RepaymentPlanResponse)
async def get_transaction_repayment_plan(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the repayment plan for a transaction.
    """
    tx_service = TransactionService(db)
    repayment_service = RepaymentService(db)
    
    transaction = tx_service.get_transaction_by_id(transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Check access
    if current_user.customer:
        if transaction.customer_id != current_user.customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this transaction"
            )
    elif current_user.merchant:
        if transaction.merchant_id != current_user.merchant.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this transaction"
            )
    
    plan = repayment_service.get_repayment_plan_by_transaction(transaction_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No repayment plan found for this transaction"
        )
    
    return RepaymentPlanResponse(
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
        transaction_reference=transaction.reference_number,
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
    )
