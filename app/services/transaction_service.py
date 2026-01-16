from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from app.models.transaction import Transaction, TransactionStatus
from app.models.customer import Customer
from app.models.merchant import Merchant
from app.models.user import User
from app.utils.security import generate_reference_number
from app.config import settings


class TransactionService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_transaction(
        self,
        merchant: Merchant,
        customer_id: int,
        amount: float,
        description: Optional[str] = None,
        product_name: Optional[str] = None
    ) -> Transaction:
        """Merchant creates a transaction request for a customer"""
        # Get customer
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise ValueError("Customer not found")
        
        if not customer.is_approved:
            raise ValueError("Customer account is not approved")
        
        # Check if customer has enough available limit
        if not customer.can_purchase(amount):
            raise ValueError(
                f"Customer does not have enough available limit. "
                f"Available: {customer.available_limit}, Required: {amount}"
            )
        
        # Calculate fee
        fee_percentage = settings.TRANSACTION_FEE_PERCENTAGE
        fee_amount, merchant_receives = Transaction.calculate_fee(amount, fee_percentage)
        
        # Create transaction
        transaction = Transaction(
            reference_number=generate_reference_number("TXN"),
            customer_id=customer_id,
            merchant_id=merchant.id,
            amount=amount,
            fee_percentage=fee_percentage,
            fee_amount=fee_amount,
            merchant_receives=merchant_receives,
            description=description,
            product_name=product_name,
            status=TransactionStatus.PENDING,
            expires_at=datetime.utcnow() + timedelta(hours=24)  # Expires in 24 hours
        )
        
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
    
    def get_transaction_by_id(self, transaction_id: int) -> Optional[Transaction]:
        """Get transaction by ID"""
        return self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    def get_transaction_by_reference(self, reference_number: str) -> Optional[Transaction]:
        """Get transaction by reference number"""
        return self.db.query(Transaction).filter(
            Transaction.reference_number == reference_number
        ).first()
    
    def approve_transaction(self, transaction: Transaction, customer: Customer) -> Transaction:
        """Customer approves a transaction"""
        if transaction.status != TransactionStatus.PENDING:
            raise ValueError(f"Transaction cannot be approved. Current status: {transaction.status}")
        
        if transaction.customer_id != customer.id:
            raise ValueError("This transaction does not belong to you")
        
        # Check if transaction has expired
        if transaction.expires_at and transaction.expires_at < datetime.utcnow():
            transaction.status = TransactionStatus.EXPIRED
            self.db.commit()
            raise ValueError("Transaction has expired")
        
        # Check customer's available limit
        if not customer.can_purchase(transaction.amount):
            raise ValueError("Insufficient available limit")
        
        # Deduct from customer's limit
        customer.use_limit(transaction.amount)
        
        # Add full amount to merchant's balance (fee will be deducted when customer completes payment)
        merchant = self.db.query(Merchant).filter(
            Merchant.id == transaction.merchant_id
        ).first()
        merchant.add_pending_amount(transaction.amount)
        
        # Update transaction status
        transaction.status = TransactionStatus.APPROVED
        transaction.approved_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
    
    def reject_transaction(
        self, 
        transaction: Transaction, 
        customer: Customer,
        reason: Optional[str] = None
    ) -> Transaction:
        """Customer rejects a transaction"""
        if transaction.status != TransactionStatus.PENDING:
            raise ValueError(f"Transaction cannot be rejected. Current status: {transaction.status}")
        
        if transaction.customer_id != customer.id:
            raise ValueError("This transaction does not belong to you")
        
        transaction.status = TransactionStatus.REJECTED
        transaction.rejected_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
    
    def cancel_transaction(self, transaction: Transaction, merchant: Merchant) -> Transaction:
        """Merchant cancels a pending transaction"""
        if transaction.status != TransactionStatus.PENDING:
            raise ValueError(f"Transaction cannot be cancelled. Current status: {transaction.status}")
        
        if transaction.merchant_id != merchant.id:
            raise ValueError("This transaction does not belong to you")
        
        transaction.status = TransactionStatus.CANCELLED
        
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
    
    def complete_transaction(self, transaction: Transaction) -> Transaction:
        """Mark transaction as completed when fully repaid and deduct fee"""
        if transaction.status != TransactionStatus.APPROVED:
            raise ValueError("Only approved transactions can be completed")
        
        # Now deduct the fee from merchant's balance
        merchant = self.db.query(Merchant).filter(
            Merchant.id == transaction.merchant_id
        ).first()
        merchant.deduct_fee(transaction.fee_amount)
        
        transaction.status = TransactionStatus.COMPLETED
        transaction.completed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
    
    def get_customer_transactions(
        self, 
        customer_id: int, 
        status: Optional[TransactionStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Transaction]:
        """Get all transactions for a customer"""
        query = self.db.query(Transaction).filter(Transaction.customer_id == customer_id)
        
        if status:
            query = query.filter(Transaction.status == status)
        
        return query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()
    
    def get_merchant_transactions(
        self, 
        merchant_id: int, 
        status: Optional[TransactionStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Transaction]:
        """Get all transactions for a merchant"""
        query = self.db.query(Transaction).filter(Transaction.merchant_id == merchant_id)
        
        if status:
            query = query.filter(Transaction.status == status)
        
        return query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()
    
    def get_pending_transactions_for_customer(self, customer_id: int) -> List[Transaction]:
        """Get pending transactions waiting for customer approval"""
        return self.db.query(Transaction).filter(
            Transaction.customer_id == customer_id,
            Transaction.status == TransactionStatus.PENDING,
            Transaction.expires_at > datetime.utcnow()
        ).order_by(Transaction.created_at.desc()).all()
    
    def expire_old_transactions(self) -> int:
        """Expire transactions that have passed their expiry time"""
        expired_count = self.db.query(Transaction).filter(
            Transaction.status == TransactionStatus.PENDING,
            Transaction.expires_at < datetime.utcnow()
        ).update({"status": TransactionStatus.EXPIRED})
        
        self.db.commit()
        return expired_count
