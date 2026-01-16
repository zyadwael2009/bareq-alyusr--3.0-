from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.models.merchant import Merchant
from app.models.user import User
from app.models.transaction import Transaction, TransactionStatus


class MerchantService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_merchant_by_id(self, merchant_id: int) -> Optional[Merchant]:
        """Get merchant by ID"""
        return self.db.query(Merchant).filter(Merchant.id == merchant_id).first()
    
    def get_merchant_by_user_id(self, user_id: int) -> Optional[Merchant]:
        """Get merchant by user ID"""
        return self.db.query(Merchant).filter(Merchant.user_id == user_id).first()
    
    def get_merchant_by_commercial_registration(self, cr: str) -> Optional[Merchant]:
        """Get merchant by commercial registration"""
        return self.db.query(Merchant).filter(
            Merchant.commercial_registration == cr
        ).first()
    
    def approve_merchant(self, merchant: Merchant) -> Merchant:
        """Approve a merchant account (admin function)"""
        merchant.is_approved = True
        merchant.approved_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(merchant)
        
        return merchant
    
    def update_merchant_profile(
        self,
        merchant: Merchant,
        business_name: Optional[str] = None,
        tax_number: Optional[str] = None,
        business_category: Optional[str] = None,
        business_address: Optional[str] = None,
        city: Optional[str] = None,
        bank_name: Optional[str] = None,
        iban: Optional[str] = None
    ) -> Merchant:
        """Update merchant profile information"""
        if business_name is not None:
            merchant.business_name = business_name
        if tax_number is not None:
            merchant.tax_number = tax_number
        if business_category is not None:
            merchant.business_category = business_category
        if business_address is not None:
            merchant.business_address = business_address
        if city is not None:
            merchant.city = city
        if bank_name is not None:
            merchant.bank_name = bank_name
        if iban is not None:
            merchant.iban = iban
        
        merchant.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(merchant)
        
        return merchant
    
    def get_merchant_balance(self, merchant: Merchant) -> dict:
        """Get merchant's balance information"""
        pending_count = self.db.query(Transaction).filter(
            Transaction.merchant_id == merchant.id,
            Transaction.status == TransactionStatus.PENDING
        ).count()
        
        completed_count = self.db.query(Transaction).filter(
            Transaction.merchant_id == merchant.id,
            Transaction.status == TransactionStatus.COMPLETED
        ).count()
        
        approved_count = self.db.query(Transaction).filter(
            Transaction.merchant_id == merchant.id,
            Transaction.status == TransactionStatus.APPROVED
        ).count()
        
        return {
            "balance": merchant.balance,
            "total_earnings": merchant.total_earnings,
            "total_fees_paid": merchant.total_fees_paid,
            "pending_transactions": pending_count,
            "approved_transactions": approved_count,
            "completed_transactions": completed_count
        }
    
    def get_all_merchants(
        self, 
        is_approved: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Merchant]:
        """Get all merchants (admin function)"""
        query = self.db.query(Merchant)
        
        if is_approved is not None:
            query = query.filter(Merchant.is_approved == is_approved)
        
        return query.offset(offset).limit(limit).all()
    
    def get_merchant_with_user(self, merchant_id: int) -> Optional[dict]:
        """Get merchant with associated user information"""
        merchant = self.get_merchant_by_id(merchant_id)
        if not merchant:
            return None
        
        user = self.db.query(User).filter(User.id == merchant.user_id).first()
        
        return {
            "merchant": merchant,
            "user": user
        }
