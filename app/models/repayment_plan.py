from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Enum as SQLEnum, String
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import enum
from app.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAYMENT_REQUESTED = "payment_requested"  # Customer requested to pay, waiting for merchant approval
    PAID = "paid"
    OVERDUE = "overdue"
    PARTIALLY_PAID = "partially_paid"


class RepaymentPlan(Base):
    """Repayment plan for a transaction - defines how customer will repay"""
    __tablename__ = "repayment_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    # Plan details
    total_amount = Column(Float, nullable=False)  # Total amount to repay
    number_of_months = Column(Integer, nullable=False)  # 1 to 28 months
    monthly_payment = Column(Float, nullable=False)  # Amount per month
    
    # Progress tracking
    total_paid = Column(Float, default=0.0)
    remaining_amount = Column(Float, nullable=False)
    payments_made = Column(Integer, default=0)
    payments_remaining = Column(Integer, nullable=False)
    
    # Status
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Dates
    start_date = Column(DateTime, nullable=False)  # When first payment is due
    end_date = Column(DateTime, nullable=False)  # When last payment is due
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="repayment_plan")
    customer = relationship("Customer", back_populates="repayment_plans")
    schedules = relationship("RepaymentSchedule", back_populates="repayment_plan", order_by="RepaymentSchedule.due_date")
    
    def __repr__(self):
        return f"<RepaymentPlan(id={self.id}, months={self.number_of_months}, monthly={self.monthly_payment})>"
    
    @staticmethod
    def calculate_monthly_payment(total_amount: float, number_of_months: int) -> float:
        """Calculate monthly payment amount"""
        if number_of_months <= 0:
            raise ValueError("Number of months must be greater than 0")
        return round(total_amount / number_of_months, 2)
    
    def generate_schedule(self, start_date: datetime = None) -> list:
        """Generate payment schedule based on plan"""
        if start_date is None:
            start_date = datetime.utcnow() + relativedelta(months=1)
        
        schedules = []
        remaining = self.total_amount
        
        for i in range(self.number_of_months):
            due_date = start_date + relativedelta(months=i)
            
            # Last payment might be slightly different due to rounding
            if i == self.number_of_months - 1:
                amount = remaining
            else:
                amount = self.monthly_payment
                remaining -= amount
            
            schedules.append({
                "installment_number": i + 1,
                "due_date": due_date,
                "amount": round(amount, 2),
                "status": PaymentStatus.PENDING
            })
        
        return schedules


class RepaymentSchedule(Base):
    """Individual payment schedule entries"""
    __tablename__ = "repayment_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    repayment_plan_id = Column(Integer, ForeignKey("repayment_plans.id"), nullable=False)
    
    # Installment details
    installment_number = Column(Integer, nullable=False)
    due_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    
    # Status
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Payment tracking
    paid_at = Column(DateTime, nullable=True)
    payment_reference = Column(String(100), nullable=True)
    payment_requested_at = Column(DateTime, nullable=True)  # When customer requested payment
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    repayment_plan = relationship("RepaymentPlan", back_populates="schedules")
    
    def __repr__(self):
        return f"<RepaymentSchedule(id={self.id}, installment={self.installment_number}, amount={self.amount})>"
    
    def request_payment(self) -> None:
        """Customer requests to pay this installment"""
        self.status = PaymentStatus.PAYMENT_REQUESTED
        self.payment_requested_at = datetime.utcnow()
    
    def mark_as_paid(self, amount: float, reference: str = None) -> bool:
        """Mark this installment as paid"""
        self.amount_paid += amount
        self.payment_reference = reference
        
        if self.amount_paid >= self.amount:
            self.status = PaymentStatus.PAID
            self.paid_at = datetime.utcnow()
            return True
        else:
            self.status = PaymentStatus.PARTIALLY_PAID
            return False
