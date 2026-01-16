"""
Test script for Bareq Al-Yusr API
Tests all endpoints in the correct flow order
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"
FLASK_URL = "http://127.0.0.1:5000"

# Store tokens and IDs for later use
tokens = {}
ids = {}

def print_header(title):
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)

def print_response(response, show_data=True):
    print(f"Status: {response.status_code}")
    if show_data:
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2, default=str)}")
            return data
        except:
            print(f"Response: {response.text}")
            return None
    return None

def test_health():
    print_header("Testing Health Check")
    response = requests.get("http://127.0.0.1:8000/health")
    return print_response(response)

def test_root():
    print_header("Testing Root Endpoint")
    response = requests.get("http://127.0.0.1:8000/")
    return print_response(response)

# ============ REGISTRATION ============

def test_register_customer():
    print_header("1. Register Customer")
    data = {
        "email": "customer@test.com",
        "phone_number": "0501234567",
        "full_name": "Ahmed Mohammed",
        "password": "password123",
        "national_id": "1234567890",
        "address": "Riyadh, Saudi Arabia",
        "city": "Riyadh"
    }
    response = requests.post(f"{BASE_URL}/auth/register/customer", params=data)
    result = print_response(response)
    if result and 'customer_id' in result:
        ids['customer_id'] = result['customer_id']
    return result

def test_register_merchant():
    print_header("2. Register Merchant")
    data = {
        "email": "merchant@test.com",
        "phone_number": "0559876543",
        "full_name": "Khalid Store",
        "password": "password123",
        "business_name": "Khalid Electronics",
        "commercial_registration": "CR123456789",
        "tax_number": "TAX987654",
        "business_category": "Electronics",
        "business_address": "Jeddah, Saudi Arabia",
        "city": "Jeddah",
        "bank_name": "Al Rajhi Bank",
        "iban": "SA0380000000608010167519"
    }
    response = requests.post(f"{BASE_URL}/auth/register/merchant", params=data)
    result = print_response(response)
    if result and 'merchant_id' in result:
        ids['merchant_id'] = result['merchant_id']
    return result

# ============ LOGIN ============

def test_login_customer():
    print_header("3. Login as Customer")
    data = {
        "email": "customer@test.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", params=data)
    result = print_response(response)
    if result and 'access_token' in result:
        tokens['customer'] = result['access_token']
    return result

def test_login_merchant():
    print_header("4. Login as Merchant")
    data = {
        "email": "merchant@test.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", params=data)
    result = print_response(response)
    if result and 'access_token' in result:
        tokens['merchant'] = result['access_token']
    return result

# ============ GET CURRENT USER ============

def test_get_me_customer():
    print_header("5. Get Current User Info (Customer)")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    return print_response(response)

def test_get_me_merchant():
    print_header("6. Get Current User Info (Merchant)")
    headers = {"Authorization": f"Bearer {tokens.get('merchant', '')}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    return print_response(response)

# ============ CUSTOMER PROFILE ============

def test_get_customer_profile():
    print_header("7. Get Customer Profile")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    response = requests.get(f"{BASE_URL}/customers/me", headers=headers)
    return print_response(response)

def test_get_customer_limit():
    print_header("8. Get Customer Credit Limit")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    response = requests.get(f"{BASE_URL}/customers/me/limit", headers=headers)
    return print_response(response)

# ============ MERCHANT PROFILE ============

def test_get_merchant_profile():
    print_header("9. Get Merchant Profile")
    headers = {"Authorization": f"Bearer {tokens.get('merchant', '')}"}
    response = requests.get(f"{BASE_URL}/merchants/me", headers=headers)
    return print_response(response)

def test_get_merchant_balance():
    print_header("10. Get Merchant Balance")
    headers = {"Authorization": f"Bearer {tokens.get('merchant', '')}"}
    response = requests.get(f"{BASE_URL}/merchants/me/balance", headers=headers)
    return print_response(response)

# ============ FLASK ADMIN ============

def test_create_admin():
    print_header("11. Create Admin User (Flask)")
    from app.config import settings
    data = {
        "email": "admin@bareq.com",
        "password": "admin123",
        "full_name": "System Admin",
        "secret_key": settings.SECRET_KEY
    }
    response = requests.post(f"{FLASK_URL}/admin/create-admin", json=data)
    return print_response(response)

def test_admin_login():
    print_header("12. Admin Login (Flask)")
    data = {
        "email": "admin@bareq.com",
        "password": "admin123"
    }
    response = requests.post(f"{FLASK_URL}/admin/login", json=data)
    result = print_response(response)
    if result and 'access_token' in result:
        tokens['admin'] = result['access_token']
    return result

def test_admin_dashboard():
    print_header("13. Admin Dashboard Stats")
    headers = {"Authorization": f"Bearer {tokens.get('admin', '')}"}
    response = requests.get(f"{FLASK_URL}/admin/dashboard", headers=headers)
    return print_response(response)

def test_admin_list_customers():
    print_header("14. Admin List Customers")
    headers = {"Authorization": f"Bearer {tokens.get('admin', '')}"}
    response = requests.get(f"{FLASK_URL}/admin/customers", headers=headers)
    return print_response(response)

def test_admin_approve_customer():
    print_header("15. Admin Approve Customer")
    headers = {"Authorization": f"Bearer {tokens.get('admin', '')}"}
    customer_id = ids.get('customer_id', 1)
    response = requests.post(f"{FLASK_URL}/admin/customers/{customer_id}/approve", headers=headers)
    return print_response(response)

def test_admin_update_credit_limit():
    print_header("16. Admin Update Customer Credit Limit")
    headers = {"Authorization": f"Bearer {tokens.get('admin', '')}"}
    customer_id = ids.get('customer_id', 1)
    data = {"credit_limit": 10000.0}
    response = requests.put(f"{FLASK_URL}/admin/customers/{customer_id}/credit-limit", headers=headers, json=data)
    return print_response(response)

def test_admin_list_merchants():
    print_header("17. Admin List Merchants")
    headers = {"Authorization": f"Bearer {tokens.get('admin', '')}"}
    response = requests.get(f"{FLASK_URL}/admin/merchants", headers=headers)
    return print_response(response)

def test_admin_approve_merchant():
    print_header("18. Admin Approve Merchant")
    headers = {"Authorization": f"Bearer {tokens.get('admin', '')}"}
    merchant_id = ids.get('merchant_id', 1)
    response = requests.post(f"{FLASK_URL}/admin/merchants/{merchant_id}/approve", headers=headers)
    return print_response(response)

# ============ CHECK UPDATED PROFILES ============

def test_get_customer_limit_after_approval():
    print_header("19. Get Customer Credit Limit (After Approval)")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    response = requests.get(f"{BASE_URL}/customers/me/limit", headers=headers)
    return print_response(response)

def test_get_merchant_balance_after_approval():
    print_header("20. Get Merchant Balance (After Approval)")
    headers = {"Authorization": f"Bearer {tokens.get('merchant', '')}"}
    response = requests.get(f"{BASE_URL}/merchants/me/balance", headers=headers)
    return print_response(response)

# ============ MERCHANT SEARCHES FOR CUSTOMER ============

def test_merchant_search_customer():
    print_header("21. Merchant Search Customer by Phone")
    headers = {"Authorization": f"Bearer {tokens.get('merchant', '')}"}
    params = {"phone_number": "0501234567"}
    response = requests.get(f"{BASE_URL}/merchants/search-customer", headers=headers, params=params)
    result = print_response(response)
    if result and len(result) > 0:
        ids['found_customer_id'] = result[0].get('customer_id')
    return result

# ============ TRANSACTION FLOW ============

def test_merchant_create_transaction():
    print_header("22. Merchant Creates Transaction (Purchase Request)")
    headers = {"Authorization": f"Bearer {tokens.get('merchant', '')}"}
    customer_id = ids.get('found_customer_id') or ids.get('customer_id', 1)
    params = {
        "customer_id": customer_id,
        "amount": 1500.0,
        "description": "Samsung Galaxy S24 Ultra",
        "product_name": "Samsung Galaxy S24 Ultra 256GB"
    }
    response = requests.post(f"{BASE_URL}/transactions/", headers=headers, params=params)
    result = print_response(response)
    if result and 'id' in result:
        ids['transaction_id'] = result['id']
        ids['transaction_ref'] = result.get('reference_number')
    return result

def test_customer_get_pending_transactions():
    print_header("23. Customer Gets Pending Transactions")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    response = requests.get(f"{BASE_URL}/customers/me/pending-transactions", headers=headers)
    return print_response(response)

def test_customer_approve_transaction():
    print_header("24. Customer Approves Transaction (6 months repayment)")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    transaction_id = ids.get('transaction_id', 1)
    params = {
        "number_of_months": 6
    }
    response = requests.post(f"{BASE_URL}/transactions/{transaction_id}/approve", headers=headers, params=params)
    result = print_response(response)
    if result and 'repayment_plan' in result:
        ids['repayment_plan_id'] = result['repayment_plan']['id']
    return result

# ============ CHECK BALANCES AFTER TRANSACTION ============

def test_customer_limit_after_purchase():
    print_header("25. Customer Credit Limit (After Purchase)")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    response = requests.get(f"{BASE_URL}/customers/me/limit", headers=headers)
    data = print_response(response)
    if data:
        print(f"\n📊 Limit Analysis:")
        print(f"   Credit Limit: {data.get('credit_limit', 0)} SAR")
        print(f"   Available: {data.get('available_limit', 0)} SAR")
        print(f"   Used: {data.get('used_limit', 0)} SAR")
    return data

def test_merchant_balance_after_transaction():
    print_header("26. Merchant Balance (After Transaction - Shows 0.5% Fee)")
    headers = {"Authorization": f"Bearer {tokens.get('merchant', '')}"}
    response = requests.get(f"{BASE_URL}/merchants/me/balance", headers=headers)
    data = print_response(response)
    if data:
        print(f"\n💰 Balance Analysis:")
        print(f"   Balance: {data.get('balance', 0)} SAR")
        print(f"   Total Earnings: {data.get('total_earnings', 0)} SAR")
        print(f"   Total Fees Paid: {data.get('total_fees_paid', 0)} SAR")
        print(f"   (Original: 1500 SAR - 0.5% fee = 7.5 SAR = 1492.5 SAR received)")
    return data

# ============ REPAYMENT FLOW ============

def test_customer_get_repayment_plans():
    print_header("27. Customer Gets Repayment Plans")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    response = requests.get(f"{BASE_URL}/repayments/plans", headers=headers)
    result = print_response(response)
    if result and len(result) > 0:
        ids['schedule_id'] = result[0].get('schedules', [{}])[0].get('id')
    return result

def test_customer_get_next_payment():
    print_header("28. Customer Gets Next Payment Due")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    plan_id = ids.get('repayment_plan_id', 1)
    response = requests.get(f"{BASE_URL}/repayments/plans/{plan_id}/next-payment", headers=headers)
    return print_response(response)

def test_customer_make_payment():
    print_header("29. Customer Makes Payment (First Installment)")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    plan_id = ids.get('repayment_plan_id', 1)
    schedule_id = ids.get('schedule_id', 1)
    params = {
        "schedule_id": schedule_id,
        "amount": 250.0,
        "payment_reference": "PAY-001"
    }
    response = requests.post(f"{BASE_URL}/repayments/plans/{plan_id}/pay", headers=headers, params=params)
    return print_response(response)

def test_customer_limit_after_payment():
    print_header("30. Customer Credit Limit (After Payment - Limit Restored)")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    response = requests.get(f"{BASE_URL}/customers/me/limit", headers=headers)
    data = print_response(response)
    if data:
        print(f"\n📊 Limit After Payment:")
        print(f"   Available: {data.get('available_limit', 0)} SAR (Increased by 250!)")
        print(f"   Used: {data.get('used_limit', 0)} SAR (Decreased by 250)")
    return data

# ============ TRANSACTION DETAILS ============

def test_get_transaction_details():
    print_header("31. Get Transaction Details")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    transaction_id = ids.get('transaction_id', 1)
    response = requests.get(f"{BASE_URL}/transactions/{transaction_id}", headers=headers)
    return print_response(response)

def test_get_transaction_repayment_plan():
    print_header("32. Get Transaction Repayment Plan")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    transaction_id = ids.get('transaction_id', 1)
    response = requests.get(f"{BASE_URL}/transactions/{transaction_id}/repayment-plan", headers=headers)
    return print_response(response)

# ============ MERCHANT TRANSACTIONS ============

def test_merchant_get_transactions():
    print_header("33. Merchant Gets All Transactions")
    headers = {"Authorization": f"Bearer {tokens.get('merchant', '')}"}
    response = requests.get(f"{BASE_URL}/merchants/me/transactions", headers=headers)
    return print_response(response)

# ============ ADMIN TRANSACTIONS ============

def test_admin_list_transactions():
    print_header("34. Admin List All Transactions")
    headers = {"Authorization": f"Bearer {tokens.get('admin', '')}"}
    response = requests.get(f"{FLASK_URL}/admin/transactions", headers=headers)
    return print_response(response)

# ============ TEST REJECT FLOW ============

def test_create_and_reject_transaction():
    print_header("35. Create Another Transaction (To Test Reject)")
    headers = {"Authorization": f"Bearer {tokens.get('merchant', '')}"}
    customer_id = ids.get('found_customer_id') or ids.get('customer_id', 1)
    params = {
        "customer_id": customer_id,
        "amount": 500.0,
        "description": "AirPods Pro",
        "product_name": "Apple AirPods Pro 2"
    }
    response = requests.post(f"{BASE_URL}/transactions/", headers=headers, params=params)
    result = print_response(response)
    if result and 'id' in result:
        ids['reject_transaction_id'] = result['id']
    return result

def test_customer_reject_transaction():
    print_header("36. Customer Rejects Transaction")
    headers = {"Authorization": f"Bearer {tokens.get('customer', '')}"}
    transaction_id = ids.get('reject_transaction_id', 2)
    params = {"reason": "Changed my mind"}
    response = requests.post(f"{BASE_URL}/transactions/{transaction_id}/reject", headers=headers, params=params)
    return print_response(response)

# ============ RUN ALL TESTS ============

def run_all_tests():
    print("\n" + "🚀" * 30)
    print("   BAREQ AL-YUSR API TEST SUITE")
    print("🚀" * 30)
    
    # Basic tests
    test_health()
    test_root()
    
    # Registration
    test_register_customer()
    test_register_merchant()
    
    # Login
    test_login_customer()
    test_login_merchant()
    
    # Get current user
    test_get_me_customer()
    test_get_me_merchant()
    
    # Profile tests (before approval)
    test_get_customer_profile()
    test_get_customer_limit()
    test_get_merchant_profile()
    test_get_merchant_balance()
    
    print("\n" + "⚠️" * 20)
    print("   STARTING FLASK ADMIN SERVER...")
    print("   Make sure Flask is running on port 5000!")
    print("⚠️" * 20)
    input("\nPress Enter after starting Flask server (python flask_admin/app.py)...")
    
    # Admin operations
    test_create_admin()
    test_admin_login()
    test_admin_dashboard()
    test_admin_list_customers()
    test_admin_approve_customer()
    test_admin_update_credit_limit()
    test_admin_list_merchants()
    test_admin_approve_merchant()
    
    # After approval
    test_get_customer_limit_after_approval()
    test_get_merchant_balance_after_approval()
    
    # Transaction flow
    test_merchant_search_customer()
    test_merchant_create_transaction()
    test_customer_get_pending_transactions()
    test_customer_approve_transaction()
    
    # Check balances after transaction
    test_customer_limit_after_purchase()
    test_merchant_balance_after_transaction()
    
    # Repayment flow
    test_customer_get_repayment_plans()
    test_customer_get_next_payment()
    test_customer_make_payment()
    test_customer_limit_after_payment()
    
    # Transaction details
    test_get_transaction_details()
    test_get_transaction_repayment_plan()
    test_merchant_get_transactions()
    test_admin_list_transactions()
    
    # Reject flow
    test_create_and_reject_transaction()
    test_customer_reject_transaction()
    
    print("\n" + "✅" * 30)
    print("   ALL TESTS COMPLETED!")
    print("✅" * 30)
    
    print("\n📋 Summary of IDs:")
    for key, value in ids.items():
        print(f"   {key}: {value}")

def run_quick_tests():
    """Run tests without waiting for Flask"""
    print("\n" + "🚀" * 30)
    print("   BAREQ AL-YUSR - QUICK TEST (FastAPI Only)")
    print("🚀" * 30)
    
    # Basic tests
    test_health()
    test_root()
    
    # Registration
    test_register_customer()
    test_register_merchant()
    
    # Login
    test_login_customer()
    test_login_merchant()
    
    # Get current user
    test_get_me_customer()
    test_get_me_merchant()
    
    # Profile tests
    test_get_customer_profile()
    test_get_customer_limit()
    test_get_merchant_profile()
    test_get_merchant_balance()
    
    print("\n" + "✅" * 20)
    print("   QUICK TESTS COMPLETED!")
    print("   Note: Run Flask for full test suite")
    print("✅" * 20)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        run_quick_tests()
    else:
        run_all_tests()
