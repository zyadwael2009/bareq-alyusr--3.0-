from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # National ID / Iqama for identity verification
    national_id = Column(String(20), unique=True, nullable=False)
    
    # Credit limit information
    credit_limit = Column(Float, default=0.0)  # Maximum credit limit
    available_limit = Column(Float, default=0.0)  # Current available limit
    used_limit = Column(Float, default=0.0)  # Currently used limit
    
    # Address information
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Status
    is_approved = Column(Boolean, default=False)  # Admin must approve
    approved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="customer")
    transactions = relationship("Transaction", back_populates="customer", foreign_keys="Transaction.customer_id")
    repayment_plans = relationship("RepaymentPlan", back_populates="customer")
    
    def __repr__(self):
        return f"<Customer(id={self.id}, user_id={self.user_id}, credit_limit={self.credit_limit})>"
    
    def can_purchase(self, amount: float) -> bool:
        """Check if customer has enough available limit for a purchase"""
        return self.is_approved and self.available_limit >= amount
    
    def use_limit(self, amount: float) -> bool:
        """Deduct from available limit when purchase is approved"""
        if self.can_purchase(amount):
            self.available_limit -= amount
            self.used_limit += amount
            return True
        return False
    
    def restore_limit(self, amount: float) -> None:
        """Restore limit when customer repays"""
        self.available_limit += amount
        self.used_limit -= amount
        # Ensure used_limit doesn't go negative
        if self.used_limit < 0:
            self.used_limit = 0
        # Ensure available_limit doesn't exceed credit_limit
        if self.available_limit > self.credit_limit:
            self.available_limit = self.credit_limit
