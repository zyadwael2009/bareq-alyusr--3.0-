from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.repayment_service import RepaymentService
from app.schemas.repayment import (
    RepaymentPlanResponse, RepaymentScheduleResponse, PaymentResponse
)
from app.utils.dependencies import get_current_customer, require_approved_customer
from app.models.customer import Customer

router = APIRouter(prefix="/repayments", tags=["Repayments"])


@router.get("/plans", response_model=List[RepaymentPlanResponse])
async def get_my_repayment_plans(
    status: str = None,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get all repayment plans for the current customer.
    """
    repayment_service = RepaymentService(db)
    
    from app.models.repayment_plan import PaymentStatus
    plan_status = None
    if status:
        try:
            plan_status = PaymentStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Valid values: {[s.value for s in PaymentStatus]}"
            )
    
    plans = repayment_service.get_customer_repayment_plans(
        customer.id,
        status=plan_status
    )
    
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


@router.get("/plans/{plan_id}", response_model=RepaymentPlanResponse)
async def get_repayment_plan(
    plan_id: int,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get a specific repayment plan with all schedules.
    """
    repayment_service = RepaymentService(db)
    
    plan = repayment_service.get_repayment_plan_by_id(plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repayment plan not found"
        )
    
    if plan.customer_id != customer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this repayment plan"
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
    )


@router.post("/plans/{plan_id}/pay", response_model=PaymentResponse)
async def make_payment(
    plan_id: int,
    schedule_id: int,
    amount: float,
    payment_reference: str = None,
    customer: Customer = Depends(require_approved_customer),
    db: Session = Depends(get_db)
):
    """
    Make a payment on a repayment schedule.
    
    This will:
    - Apply the payment to the specified installment
    - Restore the customer's available credit limit by the paid amount
    - Mark the installment as paid if fully paid
    - Mark the plan as completed if all installments are paid
    """
    repayment_service = RepaymentService(db)
    
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than 0"
        )
    
    try:
        result = repayment_service.make_payment(
            customer=customer,
            repayment_plan_id=plan_id,
            schedule_id=schedule_id,
            amount=amount,
            payment_reference=payment_reference
        )
        
        return PaymentResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/plans/{plan_id}/next-payment", response_model=RepaymentScheduleResponse)
async def get_next_payment(
    plan_id: int,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get the next pending payment for a repayment plan.
    """
    repayment_service = RepaymentService(db)
    
    plan = repayment_service.get_repayment_plan_by_id(plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repayment plan not found"
        )
    
    if plan.customer_id != customer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this repayment plan"
        )
    
    next_payment = repayment_service.get_next_payment(plan)
    
    if not next_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending payments found"
        )
    
    return RepaymentScheduleResponse(
        id=next_payment.id,
        installment_number=next_payment.installment_number,
        due_date=next_payment.due_date,
        amount=next_payment.amount,
        amount_paid=next_payment.amount_paid,
        status=next_payment.status.value,
        paid_at=next_payment.paid_at,
        payment_reference=next_payment.payment_reference
    )


@router.get("/overdue", response_model=List[RepaymentScheduleResponse])
async def get_overdue_payments(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get all overdue payments for the current customer.
    """
    repayment_service = RepaymentService(db)
    
    overdue_schedules = repayment_service.get_overdue_schedules(customer.id)
    
    return [
        RepaymentScheduleResponse(
            id=s.id,
            installment_number=s.installment_number,
            due_date=s.due_date,
            amount=s.amount,
            amount_paid=s.amount_paid,
            status=s.status.value,
            paid_at=s.paid_at,
            payment_reference=s.payment_reference
        )
        for s in overdue_schedules
    ]


@router.post("/schedules/{schedule_id}/request-payment")
async def request_payment(
    schedule_id: int,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Customer requests to pay an installment.
    This sends a notification to the merchant who needs to approve the payment.
    """
    repayment_service = RepaymentService(db)
    
    try:
        schedule = repayment_service.request_payment(customer, schedule_id)
        return {
            "success": True,
            "message": "تم إرسال طلب الدفع بنجاح. في انتظار موافقة التاجر",
            "schedule_id": schedule.id,
            "status": schedule.status.value
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
