from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Merchant(Base):
    __tablename__ = "merchants"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Business information
    business_name = Column(String(255), nullable=False)
    commercial_registration = Column(String(50), unique=True, nullable=False)  # السجل التجاري
    tax_number = Column(String(50), nullable=True)  # الرقم الضريبي
    
    # Business category
    business_category = Column(String(100), nullable=True)
    
    # Balance - money earned from transactions (after fee deduction)
    balance = Column(Float, default=0.0)
    total_earnings = Column(Float, default=0.0)  # Total earned over time
    total_fees_paid = Column(Float, default=0.0)  # Total fees paid to platform
    
    # Bank information for withdrawals
    bank_name = Column(String(100), nullable=True)
    iban = Column(String(34), nullable=True)
    
    # Address
    business_address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Status
    is_approved = Column(Boolean, default=False)
    approved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="merchant")
    transactions = relationship("Transaction", back_populates="merchant", foreign_keys="Transaction.merchant_id")
    
    def __repr__(self):
        return f"<Merchant(id={self.id}, business_name={self.business_name}, balance={self.balance})>"
    
    def add_earnings(self, amount: float, fee: float) -> None:
        """Add earnings from a transaction after fee deduction"""
        net_amount = amount - fee
        self.balance += net_amount
        self.total_earnings += net_amount
        self.total_fees_paid += fee
    
    def add_pending_amount(self, amount: float) -> None:
        """Add full amount to balance when customer approves (fee not yet deducted)"""
        self.balance += amount
        self.total_earnings += amount
    
    def deduct_fee(self, fee: float) -> None:
        """Deduct fee from balance when customer completes payment"""
        self.balance -= fee
        self.total_earnings -= fee
        self.total_fees_paid += fee
