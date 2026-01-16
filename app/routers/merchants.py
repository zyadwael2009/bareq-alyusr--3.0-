from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.services.merchant_service import MerchantService
from app.services.customer_service import CustomerService
from app.services.transaction_service import TransactionService
from app.schemas.merchant import MerchantResponse, MerchantUpdate, MerchantBalance
from app.schemas.transaction import TransactionResponse
from app.utils.dependencies import (
    get_current_user,
    get_current_merchant,
    get_current_admin,
    require_approved_merchant
)
from app.models.user import User
from app.models.merchant import Merchant

router = APIRouter(prefix="/merchants", tags=["Merchants"])


@router.get("/me", response_model=MerchantResponse)
async def get_my_profile(
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Get current merchant's profile information.
    """
    user = db.query(User).filter(User.id == merchant.user_id).first()
    
    return MerchantResponse(
        id=merchant.id,
        user_id=merchant.user_id,
        business_name=merchant.business_name,
        commercial_registration=merchant.commercial_registration,
        tax_number=merchant.tax_number,
        business_category=merchant.business_category,
        balance=merchant.balance,
        total_earnings=merchant.total_earnings,
        total_fees_paid=merchant.total_fees_paid,
        bank_name=merchant.bank_name,
        iban=merchant.iban,
        business_address=merchant.business_address,
        city=merchant.city,
        is_approved=merchant.is_approved,
        approved_at=merchant.approved_at,
        created_at=merchant.created_at,
        full_name=user.full_name if user else None,
        email=user.email if user else None,
        phone_number=user.phone_number if user else None
    )


@router.get("/me/balance", response_model=MerchantBalance)
async def get_my_balance(
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Get current merchant's balance information.
    """
    merchant_service = MerchantService(db)
    balance_info = merchant_service.get_merchant_balance(merchant)
    
    return MerchantBalance(**balance_info)


@router.put("/me", response_model=MerchantResponse)
async def update_my_profile(
    business_name: str = None,
    tax_number: str = None,
    business_category: str = None,
    business_address: str = None,
    city: str = None,
    bank_name: str = None,
    iban: str = None,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Update current merchant's profile.
    """
    merchant_service = MerchantService(db)
    updated_merchant = merchant_service.update_merchant_profile(
        merchant,
        business_name=business_name,
        tax_number=tax_number,
        business_category=business_category,
        business_address=business_address,
        city=city,
        bank_name=bank_name,
        iban=iban
    )
    
    user = db.query(User).filter(User.id == merchant.user_id).first()
    
    return MerchantResponse(
        id=updated_merchant.id,
        user_id=updated_merchant.user_id,
        business_name=updated_merchant.business_name,
        commercial_registration=updated_merchant.commercial_registration,
        tax_number=updated_merchant.tax_number,
        business_category=updated_merchant.business_category,
        balance=updated_merchant.balance,
        total_earnings=updated_merchant.total_earnings,
        total_fees_paid=updated_merchant.total_fees_paid,
        bank_name=updated_merchant.bank_name,
        iban=updated_merchant.iban,
        business_address=updated_merchant.business_address,
        city=updated_merchant.city,
        is_approved=updated_merchant.is_approved,
        approved_at=updated_merchant.approved_at,
        created_at=updated_merchant.created_at,
        full_name=user.full_name if user else None,
        email=user.email if user else None,
        phone_number=user.phone_number if user else None
    )


@router.get("/me/transactions", response_model=List[TransactionResponse])
async def get_my_transactions(
    status: str = None,
    limit: int = 50,
    offset: int = 0,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Get all transactions for the current merchant.
    """
    tx_service = TransactionService(db)
    
    from app.models.transaction import TransactionStatus
    tx_status = None
    if status:
        try:
            tx_status = TransactionStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Valid values: {[s.value for s in TransactionStatus]}"
            )
    
    transactions = tx_service.get_merchant_transactions(
        merchant.id,
        status=tx_status,
        limit=limit,
        offset=offset
    )
    
    responses = []
    for tx in transactions:
        customer_user = db.query(User).join(
            Customer, Customer.user_id == User.id
        ).filter(Customer.id == tx.customer_id).first()
        
        responses.append(TransactionResponse(
            id=tx.id,
            reference_number=tx.reference_number,
            customer_id=tx.customer_id,
            merchant_id=tx.merchant_id,
            amount=tx.amount,
            fee_percentage=tx.fee_percentage,
            fee_amount=tx.fee_amount,
            merchant_receives=tx.merchant_receives,
            description=tx.description,
            product_name=tx.product_name,
            status=tx.status.value,
            created_at=tx.created_at,
            approved_at=tx.approved_at,
            rejected_at=tx.rejected_at,
            completed_at=tx.completed_at,
            expires_at=tx.expires_at,
            customer_name=customer_user.full_name if customer_user else None
        ))
    
    return responses


@router.get("/search-customer", response_model=List[dict])
async def search_customer_by_phone(
    phone_number: str,
    merchant: Merchant = Depends(require_approved_merchant),
    db: Session = Depends(get_db)
):
    """
    Search for a customer by phone number.
    
    Merchants use this to find customers before sending purchase requests.
    """
    customer_service = CustomerService(db)
    results = customer_service.search_customers_by_phone(phone_number)
    
    return results


@router.get("/search-customer-by-id", response_model=dict)
async def search_customer_by_id(
    customer_id: int,
    merchant: Merchant = Depends(require_approved_merchant),
    db: Session = Depends(get_db)
):
    """
    Search for a customer by their customer ID (رقم العميل).
    
    Merchants use this to find customers before sending purchase requests.
    """
    customer_service = CustomerService(db)
    result = customer_service.get_customer_by_customer_id(customer_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="لم يتم العثور على العميل"
        )
    
    return result


@router.get("/me/payment-requests", response_model=List[dict])
async def get_payment_requests(
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Get all pending payment requests from customers.
    """
    from app.services.repayment_service import RepaymentService
    repayment_service = RepaymentService(db)
    
    requests = repayment_service.get_pending_payment_requests(merchant.id)
    return requests


@router.post("/payment-requests/{schedule_id}/approve", response_model=dict)
async def approve_payment_request(
    schedule_id: int,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Approve a payment request from a customer.
    This confirms that the customer has paid the merchant.
    """
    from app.services.repayment_service import RepaymentService
    repayment_service = RepaymentService(db)
    
    try:
        result = repayment_service.approve_payment_request(merchant.id, schedule_id)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/payment-requests/{schedule_id}/reject", response_model=dict)
async def reject_payment_request(
    schedule_id: int,
    reason: str = None,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Reject a payment request from a customer.
    """
    from app.services.repayment_service import RepaymentService
    repayment_service = RepaymentService(db)
    
    try:
        repayment_service.reject_payment_request(merchant.id, schedule_id, reason)
        return {
            "success": True,
            "message": "تم رفض طلب الدفع"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Admin Endpoints ============

@router.get("/", response_model=List[MerchantResponse])
async def list_all_merchants(
    is_approved: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    List all merchants (Admin only).
    """
    merchant_service = MerchantService(db)
    merchants = merchant_service.get_all_merchants(
        is_approved=is_approved,
        limit=limit,
        offset=offset
    )
    
    responses = []
    for merchant in merchants:
        user = db.query(User).filter(User.id == merchant.user_id).first()
        responses.append(MerchantResponse(
            id=merchant.id,
            user_id=merchant.user_id,
            business_name=merchant.business_name,
            commercial_registration=merchant.commercial_registration,
            tax_number=merchant.tax_number,
            business_category=merchant.business_category,
            balance=merchant.balance,
            total_earnings=merchant.total_earnings,
            total_fees_paid=merchant.total_fees_paid,
            bank_name=merchant.bank_name,
            iban=merchant.iban,
            business_address=merchant.business_address,
            city=merchant.city,
            is_approved=merchant.is_approved,
            approved_at=merchant.approved_at,
            created_at=merchant.created_at,
            full_name=user.full_name if user else None,
            email=user.email if user else None,
            phone_number=user.phone_number if user else None
        ))
    
    return responses


@router.post("/{merchant_id}/approve", response_model=dict)
async def approve_merchant(
    merchant_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Approve a merchant account (Admin only).
    """
    merchant_service = MerchantService(db)
    merchant = merchant_service.get_merchant_by_id(merchant_id)
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant not found"
        )
    
    if merchant.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Merchant is already approved"
        )
    
    merchant_service.approve_merchant(merchant)
    
    return {
        "message": "Merchant approved successfully",
        "merchant_id": merchant_id,
        "business_name": merchant.business_name
    }


# Import Customer model for the join query
from app.models.customer import Customer
