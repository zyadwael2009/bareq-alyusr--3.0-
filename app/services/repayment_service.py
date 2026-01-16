from sqlalchemy.orm import Session
from datetime import datetime
from dateutil.relativedelta import relativedelta
from typing import Optional, List
from app.models.repayment_plan import RepaymentPlan, RepaymentSchedule, PaymentStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.customer import Customer


class RepaymentService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_repayment_plan(
        self,
        transaction: Transaction,
        customer: Customer,
        number_of_months: int
    ) -> RepaymentPlan:
        """Create a repayment plan when customer approves a transaction"""
        if number_of_months < 1 or number_of_months > 28:
            raise ValueError("Number of months must be between 1 and 28")
        
        if transaction.status != TransactionStatus.APPROVED:
            raise ValueError("Transaction must be approved to create a repayment plan")
        
        # Check if plan already exists
        existing_plan = self.db.query(RepaymentPlan).filter(
            RepaymentPlan.transaction_id == transaction.id
        ).first()
        if existing_plan:
            raise ValueError("Repayment plan already exists for this transaction")
        
        # Calculate monthly payment
        total_amount = transaction.amount
        monthly_payment = RepaymentPlan.calculate_monthly_payment(total_amount, number_of_months)
        
        # Calculate start and end dates
        start_date = datetime.utcnow() + relativedelta(months=1)
        end_date = start_date + relativedelta(months=number_of_months - 1)
        
        # Create repayment plan
        repayment_plan = RepaymentPlan(
            transaction_id=transaction.id,
            customer_id=customer.id,
            total_amount=total_amount,
            number_of_months=number_of_months,
            monthly_payment=monthly_payment,
            total_paid=0.0,
            remaining_amount=total_amount,
            payments_made=0,
            payments_remaining=number_of_months,
            status=PaymentStatus.PENDING,
            start_date=start_date,
            end_date=end_date
        )
        
        self.db.add(repayment_plan)
        self.db.flush()
        
        # Generate and create schedule entries
        schedule_data = repayment_plan.generate_schedule(start_date)
        for schedule_item in schedule_data:
            schedule = RepaymentSchedule(
                repayment_plan_id=repayment_plan.id,
                installment_number=schedule_item["installment_number"],
                due_date=schedule_item["due_date"],
                amount=schedule_item["amount"],
                status=PaymentStatus.PENDING
            )
            self.db.add(schedule)
        
        self.db.commit()
        self.db.refresh(repayment_plan)
        
        return repayment_plan
    
    def get_repayment_plan_by_id(self, plan_id: int) -> Optional[RepaymentPlan]:
        """Get repayment plan by ID"""
        return self.db.query(RepaymentPlan).filter(RepaymentPlan.id == plan_id).first()
    
    def get_repayment_plan_by_transaction(self, transaction_id: int) -> Optional[RepaymentPlan]:
        """Get repayment plan by transaction ID"""
        return self.db.query(RepaymentPlan).filter(
            RepaymentPlan.transaction_id == transaction_id
        ).first()
    
    def get_customer_repayment_plans(
        self, 
        customer_id: int,
        status: Optional[PaymentStatus] = None
    ) -> List[RepaymentPlan]:
        """Get all repayment plans for a customer"""
        query = self.db.query(RepaymentPlan).filter(
            RepaymentPlan.customer_id == customer_id
        )
        
        if status:
            query = query.filter(RepaymentPlan.status == status)
        
        return query.order_by(RepaymentPlan.created_at.desc()).all()
    
    def get_schedule_by_id(self, schedule_id: int) -> Optional[RepaymentSchedule]:
        """Get repayment schedule by ID"""
        return self.db.query(RepaymentSchedule).filter(
            RepaymentSchedule.id == schedule_id
        ).first()
    
    def make_payment(
        self,
        customer: Customer,
        repayment_plan_id: int,
        schedule_id: int,
        amount: float,
        payment_reference: Optional[str] = None
    ) -> dict:
        """Make a payment on a repayment schedule"""
        # Get the repayment plan
        plan = self.get_repayment_plan_by_id(repayment_plan_id)
        if not plan:
            raise ValueError("Repayment plan not found")
        
        if plan.customer_id != customer.id:
            raise ValueError("This repayment plan does not belong to you")
        
        if plan.status == PaymentStatus.PAID:
            raise ValueError("This repayment plan is already fully paid")
        
        # Get the schedule
        schedule = self.get_schedule_by_id(schedule_id)
        if not schedule:
            raise ValueError("Payment schedule not found")
        
        if schedule.repayment_plan_id != plan.id:
            raise ValueError("This schedule does not belong to the specified plan")
        
        if schedule.status == PaymentStatus.PAID:
            raise ValueError("This installment is already paid")
        
        # Make the payment
        remaining_for_installment = schedule.amount - schedule.amount_paid
        if amount > remaining_for_installment:
            amount = remaining_for_installment  # Cap at remaining amount
        
        schedule.amount_paid += amount
        schedule.payment_reference = payment_reference
        
        if schedule.amount_paid >= schedule.amount:
            schedule.status = PaymentStatus.PAID
            schedule.paid_at = datetime.utcnow()
            plan.payments_made += 1
            plan.payments_remaining -= 1
        else:
            schedule.status = PaymentStatus.PARTIALLY_PAID
        
        # Update plan totals
        plan.total_paid += amount
        plan.remaining_amount -= amount
        
        # Restore customer's limit
        customer.restore_limit(amount)
        
        # Check if plan is fully paid
        if plan.remaining_amount <= 0:
            plan.status = PaymentStatus.PAID
            plan.completed_at = datetime.utcnow()
            plan.remaining_amount = 0
            
            # Mark transaction as completed
            from app.services.transaction_service import TransactionService
            tx_service = TransactionService(self.db)
            tx_service.complete_transaction(plan.transaction)
        
        self.db.commit()
        self.db.refresh(plan)
        self.db.refresh(schedule)
        self.db.refresh(customer)
        
        return {
            "success": True,
            "message": "Payment processed successfully",
            "amount_paid": amount,
            "remaining_for_installment": schedule.amount - schedule.amount_paid,
            "total_remaining": plan.remaining_amount,
            "schedule_status": schedule.status,
            "plan_status": plan.status,
            "limit_restored": amount
        }
    
    def get_next_payment(self, plan: RepaymentPlan) -> Optional[RepaymentSchedule]:
        """Get the next pending payment for a plan"""
        return self.db.query(RepaymentSchedule).filter(
            RepaymentSchedule.repayment_plan_id == plan.id,
            RepaymentSchedule.status.in_([PaymentStatus.PENDING, PaymentStatus.PARTIALLY_PAID])
        ).order_by(RepaymentSchedule.due_date).first()
    
    def check_overdue_payments(self) -> int:
        """Mark overdue payments"""
        now = datetime.utcnow()
        
        overdue_count = self.db.query(RepaymentSchedule).filter(
            RepaymentSchedule.status == PaymentStatus.PENDING,
            RepaymentSchedule.due_date < now
        ).update({"status": PaymentStatus.OVERDUE})
        
        self.db.commit()
        return overdue_count
    
    def get_overdue_schedules(self, customer_id: int) -> List[RepaymentSchedule]:
        """Get all overdue schedules for a customer"""
        return self.db.query(RepaymentSchedule).join(RepaymentPlan).filter(
            RepaymentPlan.customer_id == customer_id,
            RepaymentSchedule.status == PaymentStatus.OVERDUE
        ).order_by(RepaymentSchedule.due_date).all()
    
    def request_payment(
        self,
        customer: Customer,
        schedule_id: int
    ) -> RepaymentSchedule:
        """Customer requests to pay an installment - awaits merchant approval"""
        schedule = self.get_schedule_by_id(schedule_id)
        if not schedule:
            raise ValueError("Payment schedule not found")
        
        plan = self.get_repayment_plan_by_id(schedule.repayment_plan_id)
        if plan.customer_id != customer.id:
            raise ValueError("This schedule does not belong to you")
        
        if schedule.status == PaymentStatus.PAID:
            raise ValueError("This installment is already paid")
        
        if schedule.status == PaymentStatus.PAYMENT_REQUESTED:
            raise ValueError("Payment already requested for this installment")
        
        schedule.request_payment()
        self.db.commit()
        self.db.refresh(schedule)
        
        return schedule
    
    def get_pending_payment_requests(self, merchant_id: int) -> List[dict]:
        """Get all payment requests waiting for merchant approval"""
        from app.models.transaction import Transaction
        from app.models.user import User
        
        # Get all schedules with payment_requested status for this merchant's transactions
        schedules = self.db.query(RepaymentSchedule).join(
            RepaymentPlan
        ).join(
            Transaction, RepaymentPlan.transaction_id == Transaction.id
        ).filter(
            Transaction.merchant_id == merchant_id,
            RepaymentSchedule.status == PaymentStatus.PAYMENT_REQUESTED
        ).all()
        
        results = []
        for schedule in schedules:
            plan = schedule.repayment_plan
            transaction = plan.transaction
            customer = plan.customer
            user = self.db.query(User).filter(User.id == customer.user_id).first()
            
            results.append({
                "schedule_id": schedule.id,
                "plan_id": plan.id,
                "transaction_id": transaction.id,
                "transaction_reference": transaction.reference_number,
                "customer_id": customer.id,
                "customer_name": user.full_name if user else None,
                "installment_number": schedule.installment_number,
                "amount": schedule.amount,
                "due_date": schedule.due_date,
                "requested_at": schedule.payment_requested_at,
                "total_installments": plan.number_of_months
            })
        
        return results
    
    def approve_payment_request(
        self,
        merchant_id: int,
        schedule_id: int
    ) -> dict:
        """Merchant approves a payment request"""
        from app.models.transaction import Transaction
        
        schedule = self.get_schedule_by_id(schedule_id)
        if not schedule:
            raise ValueError("Payment schedule not found")
        
        plan = self.get_repayment_plan_by_id(schedule.repayment_plan_id)
        transaction = plan.transaction
        
        if transaction.merchant_id != merchant_id:
            raise ValueError("This payment request does not belong to you")
        
        if schedule.status != PaymentStatus.PAYMENT_REQUESTED:
            raise ValueError("This installment does not have a pending payment request")
        
        # Get the customer
        customer = self.db.query(Customer).filter(Customer.id == plan.customer_id).first()
        
        # Process the payment
        amount = schedule.amount - schedule.amount_paid
        schedule.amount_paid = schedule.amount
        schedule.status = PaymentStatus.PAID
        schedule.paid_at = datetime.utcnow()
        
        # Update plan totals
        plan.total_paid += amount
        plan.remaining_amount -= amount
        plan.payments_made += 1
        plan.payments_remaining -= 1
        
        # Restore customer's limit
        customer.restore_limit(amount)
        
        # Check if plan is fully paid
        if plan.remaining_amount <= 0:
            plan.status = PaymentStatus.PAID
            plan.completed_at = datetime.utcnow()
            plan.remaining_amount = 0
            
            # Mark transaction as completed (this also deducts the fee)
            from app.services.transaction_service import TransactionService
            tx_service = TransactionService(self.db)
            tx_service.complete_transaction(transaction)
        
        self.db.commit()
        self.db.refresh(plan)
        self.db.refresh(schedule)
        self.db.refresh(customer)
        
        return {
            "success": True,
            "message": "Payment approved successfully",
            "amount_paid": amount,
            "total_remaining": plan.remaining_amount,
            "plan_status": plan.status.value,
            "limit_restored": amount
        }
    
    def reject_payment_request(
        self,
        merchant_id: int,
        schedule_id: int,
        reason: str = None
    ) -> RepaymentSchedule:
        """Merchant rejects a payment request"""
        from app.models.transaction import Transaction
        
        schedule = self.get_schedule_by_id(schedule_id)
        if not schedule:
            raise ValueError("Payment schedule not found")
        
        plan = self.get_repayment_plan_by_id(schedule.repayment_plan_id)
        transaction = plan.transaction
        
        if transaction.merchant_id != merchant_id:
            raise ValueError("This payment request does not belong to you")
        
        if schedule.status != PaymentStatus.PAYMENT_REQUESTED:
            raise ValueError("This installment does not have a pending payment request")
        
        # Reset to pending
        schedule.status = PaymentStatus.PENDING
        schedule.payment_requested_at = None
        
        self.db.commit()
        self.db.refresh(schedule)
        
        return schedule
