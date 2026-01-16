from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.models.customer import Customer
from app.models.user import User


class CustomerService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_customer_by_id(self, customer_id: int) -> Optional[Customer]:
        """Get customer by ID"""
        return self.db.query(Customer).filter(Customer.id == customer_id).first()
    
    def get_customer_by_user_id(self, user_id: int) -> Optional[Customer]:
        """Get customer by user ID"""
        return self.db.query(Customer).filter(Customer.user_id == user_id).first()
    
    def get_customer_by_national_id(self, national_id: str) -> Optional[Customer]:
        """Get customer by national ID"""
        return self.db.query(Customer).filter(Customer.national_id == national_id).first()
    
    def update_credit_limit(
        self, 
        customer: Customer, 
        new_limit: float,
        reason: Optional[str] = None
    ) -> Customer:
        """Update customer's credit limit (admin function)"""
        if new_limit < 0:
            raise ValueError("Credit limit cannot be negative")
        
        old_limit = customer.credit_limit
        difference = new_limit - old_limit
        
        customer.credit_limit = new_limit
        customer.available_limit += difference
        
        # Ensure available_limit doesn't exceed credit_limit
        if customer.available_limit > customer.credit_limit:
            customer.available_limit = customer.credit_limit
        
        # Ensure available_limit doesn't go negative
        if customer.available_limit < 0:
            customer.available_limit = 0
        
        self.db.commit()
        self.db.refresh(customer)
        
        return customer
    
    def approve_customer(self, customer: Customer) -> Customer:
        """Approve a customer account (admin function)"""
        customer.is_approved = True
        customer.approved_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(customer)
        
        return customer
    
    def update_customer_profile(
        self,
        customer: Customer,
        address: Optional[str] = None,
        city: Optional[str] = None
    ) -> Customer:
        """Update customer profile information"""
        if address is not None:
            customer.address = address
        if city is not None:
            customer.city = city
        
        customer.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(customer)
        
        return customer
    
    def get_all_customers(
        self, 
        is_approved: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Customer]:
        """Get all customers (admin function)"""
        query = self.db.query(Customer)
        
        if is_approved is not None:
            query = query.filter(Customer.is_approved == is_approved)
        
        return query.offset(offset).limit(limit).all()
    
    def get_customer_with_user(self, customer_id: int) -> Optional[dict]:
        """Get customer with associated user information"""
        customer = self.get_customer_by_id(customer_id)
        if not customer:
            return None
        
        user = self.db.query(User).filter(User.id == customer.user_id).first()
        
        return {
            "customer": customer,
            "user": user
        }
    
    def search_customers_by_phone(self, phone_number: str) -> List[dict]:
        """Search customers by phone number (for merchants to find customers)"""
        users = self.db.query(User).filter(
            User.phone_number.like(f"%{phone_number}%")
        ).all()
        
        results = []
        for user in users:
            customer = self.db.query(Customer).filter(
                Customer.user_id == user.id
            ).first()
            if customer and customer.is_approved:
                results.append({
                    "customer_id": customer.id,
                    "full_name": user.full_name,
                    "phone_number": user.phone_number,
                    "available_limit": customer.available_limit
                })
        
        return results

    def get_customer_by_customer_id(self, customer_id: int) -> Optional[dict]:
        """Get customer by customer ID (for merchants to find customers by رقم العميل)"""
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        
        if not customer or not customer.is_approved:
            return None
        
        user = self.db.query(User).filter(User.id == customer.user_id).first()
        
        if not user:
            return None
        
        return {
            "id": customer.id,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "available_limit": customer.available_limit,
            "credit_limit": customer.credit_limit
        }
