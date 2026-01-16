from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"  # Merchant sent request, waiting for customer
    APPROVED = "approved"  # Customer approved the purchase
    REJECTED = "rejected"  # Customer rejected the purchase
    CANCELLED = "cancelled"  # Merchant cancelled the request
    COMPLETED = "completed"  # Transaction fully repaid
    EXPIRED = "expired"  # Request expired without customer response


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Reference number for tracking
    reference_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Parties involved
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    
    # Transaction details
    amount = Column(Float, nullable=False)  # Original purchase amount
    fee_percentage = Column(Float, default=0.5)  # Fee percentage at time of transaction
    fee_amount = Column(Float, nullable=False)  # Calculated fee amount
    merchant_receives = Column(Float, nullable=False)  # Amount merchant receives after fee
    
    # Product/Service description
    description = Column(Text, nullable=True)
    product_name = Column(String(255), nullable=True)
    
    # Status
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)  # When merchant sent request
    approved_at = Column(DateTime, nullable=True)  # When customer approved
    rejected_at = Column(DateTime, nullable=True)  # When customer rejected
    completed_at = Column(DateTime, nullable=True)  # When fully repaid
    expires_at = Column(DateTime, nullable=True)  # When request expires
    
    # Relationships
    customer = relationship("Customer", back_populates="transactions", foreign_keys=[customer_id])
    merchant = relationship("Merchant", back_populates="transactions", foreign_keys=[merchant_id])
    repayment_plan = relationship("RepaymentPlan", back_populates="transaction", uselist=False)
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, ref={self.reference_number}, amount={self.amount}, status={self.status})>"
    
    @staticmethod
    def calculate_fee(amount: float, fee_percentage: float = 0.5) -> tuple:
        """Calculate fee and merchant receives amount"""
        fee_amount = amount * (fee_percentage / 100)
        merchant_receives = amount - fee_amount
        return fee_amount, merchant_receives
