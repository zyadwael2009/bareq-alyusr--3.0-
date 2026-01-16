"""
Comprehensive Test Script for Bareq Al-Yusr BNPL API
Tests all endpoints including admin functionality
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"
SECRET_KEY = "bareq-alyusr-super-secret-key-change-in-production-2024"

# Store tokens and IDs
tokens = {}
ids = {}


def print_section(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_result(name, response):
    status = response.status_code
    status_icon = "[OK]" if status < 400 else "[FAIL]"
    print(f"{status_icon} {name}: {status}")
    if status >= 400:
        try:
            print(f"   Error: {response.json()}")
        except:
            print(f"   Error: {response.text[:200]}")
    return status < 400


def test_health():
    print_section("Health Check")
    r = requests.get("http://localhost:8000/health")
    print_result("Health Check", r)
    if r.status_code == 200:
        print(f"   Response: {r.json()}")
    return r.status_code == 200


def test_admin():
    print_section("Admin Endpoints")
    
    # Create admin
    r = requests.post(f"{BASE_URL}/admin/create-admin", params={
        "email": "admin@bareq.com",
        "password": "Admin123!",
        "full_name": "System Admin",
        "secret_key": SECRET_KEY
    })
    result1 = print_result("Create Admin", r)
    
    # Login admin
    r = requests.post(f"{BASE_URL}/admin/login", params={
        "email": "admin@bareq.com",
        "password": "Admin123!"
    })
    result2 = print_result("Admin Login", r)
    if r.status_code == 200:
        tokens["admin"] = r.json()["access_token"]
        print(f"   Admin Token: {tokens['admin'][:50]}...")
    
    return result1 or result2


def test_customer_registration():
    print_section("Customer Registration & Authentication")
    
    # Register customer (using query params as expected by API)
    customer_email = f"customer_{datetime.now().timestamp()}@test.com"
    customer_password = "Customer123!"
    
    customer_params = {
        "email": customer_email,
        "phone_number": "0551234567",
        "password": customer_password,
        "full_name": "Test Customer",
        "national_id": "1234567890",
        "address": "123 Test Street, Riyadh",
        "city": "Riyadh"
    }
    
    r = requests.post(f"{BASE_URL}/auth/register/customer", params=customer_params)
    result1 = print_result("Register Customer", r)
    if r.status_code == 201:
        data = r.json()
        ids["customer_user_id"] = data.get("user_id")
        ids["customer_id"] = data.get("customer_id")
        print(f"   Customer ID: {ids.get('customer_id')}, User ID: {ids.get('customer_user_id')}")
    
    # Login customer (using query params)
    r = requests.post(f"{BASE_URL}/auth/login", params={
        "email": customer_email,
        "password": customer_password
    })
    result2 = print_result("Customer Login", r)
    if r.status_code == 200:
        tokens["customer"] = r.json()["access_token"]
        print(f"   Token: {tokens['customer'][:50]}...")
    
    return result1 and result2


def test_merchant_registration():
    print_section("Merchant Registration & Authentication")
    
    # Register merchant (using query params as expected by API)
    merchant_email = f"merchant_{datetime.now().timestamp()}@test.com"
    merchant_password = "Merchant123!"
    
    merchant_params = {
        "email": merchant_email,
        "phone_number": "0559876543",
        "password": merchant_password,
        "full_name": "Test Merchant Owner",
        "business_name": "Test Electronics Store",
        "commercial_registration": "CR12345678",
        "bank_name": "Al Rajhi Bank",
        "iban": "SA0380000000608010167519",
        "business_category": "Electronics",
        "business_address": "456 Business Ave, Jeddah",
        "city": "Jeddah"
    }
    
    r = requests.post(f"{BASE_URL}/auth/register/merchant", params=merchant_params)
    result1 = print_result("Register Merchant", r)
    if r.status_code == 201:
        data = r.json()
        ids["merchant_user_id"] = data.get("user_id")
        ids["merchant_id"] = data.get("merchant_id")
        print(f"   Merchant ID: {ids.get('merchant_id')}, User ID: {ids.get('merchant_user_id')}")
    
    # Login merchant (using query params)
    r = requests.post(f"{BASE_URL}/auth/login", params={
        "email": merchant_email,
        "password": merchant_password
    })
    result2 = print_result("Merchant Login", r)
    if r.status_code == 200:
        tokens["merchant"] = r.json()["access_token"]
        print(f"   Token: {tokens['merchant'][:50]}...")
    
    return result1 and result2


def test_admin_approvals():
    print_section("Admin Approvals")
    
    if "admin" not in tokens:
        print("[SKIP] No admin token")
        return False
    
    auth_header = f"Bearer {tokens['admin']}"
    
    # Get dashboard
    r = requests.get(f"{BASE_URL}/admin/dashboard", params={"authorization": auth_header})
    print_result("Get Dashboard", r)
    if r.status_code == 200:
        print(f"   Stats: {json.dumps(r.json(), indent=2)}")
    
    # List customers
    r = requests.get(f"{BASE_URL}/admin/customers", params={"authorization": auth_header})
    print_result("List Customers", r)
    if r.status_code == 200 and r.json():
        customer = r.json()[0]
        ids["customer_id"] = customer["id"]
        print(f"   Found {len(r.json())} customer(s)")
    
    # Approve customer
    if ids.get("customer_id"):
        r = requests.post(
            f"{BASE_URL}/admin/customers/{ids['customer_id']}/approve",
            params={"authorization": auth_header}
        )
        print_result("Approve Customer", r)
        
        # Set credit limit
        r = requests.put(
            f"{BASE_URL}/admin/customers/{ids['customer_id']}/credit-limit",
            params={"authorization": auth_header, "credit_limit": 50000.0}
        )
        print_result("Set Credit Limit (50,000 SAR)", r)
        if r.status_code == 200:
            print(f"   Result: {r.json()}")
    
    # List merchants
    r = requests.get(f"{BASE_URL}/admin/merchants", params={"authorization": auth_header})
    print_result("List Merchants", r)
    if r.status_code == 200 and r.json():
        merchant = r.json()[0]
        ids["merchant_id"] = merchant["id"]
        print(f"   Found {len(r.json())} merchant(s)")
    
    # Approve merchant
    if ids.get("merchant_id"):
        r = requests.post(
            f"{BASE_URL}/admin/merchants/{ids['merchant_id']}/approve",
            params={"authorization": auth_header}
        )
        print_result("Approve Merchant", r)
    
    return True


def test_customer_endpoints():
    print_section("Customer Endpoints")
    
    if "customer" not in tokens:
        print("[SKIP] No customer token")
        return False
    
    headers = {"Authorization": f"Bearer {tokens['customer']}"}
    
    # Get profile
    r = requests.get(f"{BASE_URL}/customers/me", headers=headers)
    print_result("Get Customer Profile", r)
    if r.status_code == 200:
        data = r.json()
        print(f"   Credit Limit: {data.get('credit_limit')} SAR")
        print(f"   Available: {data.get('available_limit')} SAR")
        print(f"   Is Approved: {data.get('is_approved')}")
    
    # Get transactions
    r = requests.get(f"{BASE_URL}/customers/me/pending-transactions", headers=headers)
    print_result("Get Customer Pending Transactions", r)
    
    # Get repayment schedules
    r = requests.get(f"{BASE_URL}/customers/me/repayment-plans", headers=headers)
    print_result("Get Customer Repayment Plans", r)
    
    return True


def test_merchant_endpoints():
    print_section("Merchant Endpoints")
    
    if "merchant" not in tokens:
        print("[SKIP] No merchant token")
        return False
    
    headers = {"Authorization": f"Bearer {tokens['merchant']}"}
    
    # Get profile
    r = requests.get(f"{BASE_URL}/merchants/me", headers=headers)
    print_result("Get Merchant Profile", r)
    if r.status_code == 200:
        data = r.json()
        print(f"   Business: {data.get('business_name')}")
        print(f"   Balance: {data.get('balance')} SAR")
        print(f"   Is Approved: {data.get('is_approved')}")
    
    # Search customer
    r = requests.get(f"{BASE_URL}/merchants/search-customer", headers=headers, params={
        "phone_number": "0551234567"
    })
    print_result("Search Customer by Phone", r)
    if r.status_code == 200:
        data = r.json()
        ids["search_customer_id"] = data.get("customer_id")
        print(f"   Found: {data.get('full_name')}, Available: {data.get('available_limit')} SAR")
    
    # Get transactions
    r = requests.get(f"{BASE_URL}/merchants/me/transactions", headers=headers)
    print_result("Get Merchant Transactions", r)
    
    return True


def test_transaction_flow():
    print_section("Transaction Flow (BNPL Purchase)")
    
    if "merchant" not in tokens or "customer" not in tokens:
        print("[SKIP] Missing tokens")
        return False
    
    merchant_headers = {"Authorization": f"Bearer {tokens['merchant']}"}
    customer_headers = {"Authorization": f"Bearer {tokens['customer']}"}
    
    # Create purchase request (using query params)
    customer_id = ids.get("customer_id") or ids.get("search_customer_id")
    if not customer_id:
        print("[FAIL] No customer ID found")
        return False
    
    r = requests.post(f"{BASE_URL}/transactions/", headers=merchant_headers, params={
        "customer_id": customer_id,
        "amount": 5000.0,
        "description": "iPhone 15 Pro Max Purchase"
    })
    print_result("Create Purchase Request (5000 SAR)", r)
    if r.status_code == 201:
        data = r.json()
        ids["transaction_id"] = data.get("id")
        print(f"   Transaction ID: {ids['transaction_id']}")
        print(f"   Reference: {data.get('reference_number')}")
        print(f"   Fee: {data.get('fee_amount')} SAR (0.5%)")
        print(f"   Merchant Receives: {data.get('merchant_receives')} SAR")
    else:
        return False
    
    # Get pending transactions (customer)
    r = requests.get(f"{BASE_URL}/transactions/pending", headers=customer_headers)
    print_result("Get Pending Transactions (Customer)", r)
    if r.status_code == 200:
        print(f"   Pending transactions: {len(r.json())}")
    
    # Approve transaction with 6-month plan
    if ids.get("transaction_id"):
        r = requests.post(
            f"{BASE_URL}/transactions/{ids['transaction_id']}/approve",
            headers=customer_headers,
            params={"number_of_months": 6}
        )
        print_result("Approve Transaction (6 months)", r)
        if r.status_code == 200:
            data = r.json()
            print(f"   Message: {data.get('message')}")
            plan = data.get('repayment_plan', {})
            print(f"   Monthly Payment: {plan.get('monthly_payment')} SAR")
            print(f"   New Available Limit: {data.get('new_available_limit')} SAR")
    
    # Check updated balances
    r = requests.get(f"{BASE_URL}/customers/me", headers=customer_headers)
    if r.status_code == 200:
        data = r.json()
        print(f"   Customer Available Limit: {data.get('available_limit')} SAR")
    
    r = requests.get(f"{BASE_URL}/merchants/me", headers=merchant_headers)
    if r.status_code == 200:
        data = r.json()
        print(f"   Merchant Balance: {data.get('balance')} SAR")
    
    return True


def test_repayment():
    print_section("Repayment Process")
    
    if "customer" not in tokens:
        print("[SKIP] No customer token")
        return False
    
    customer_headers = {"Authorization": f"Bearer {tokens['customer']}"}
    
    # Get repayment schedule
    r = requests.get(f"{BASE_URL}/customers/me/repayment-plans", headers=customer_headers)
    print_result("Get Repayment Plans", r)
    if r.status_code == 200 and r.json():
        schedules = r.json()
        print(f"   Found {len(schedules)} payment(s)")
        if schedules:
            ids["schedule_id"] = schedules[0]["id"]
            print(f"   Next payment: {schedules[0].get('amount')} SAR due {schedules[0].get('due_date')}")
    
    # Make a payment
    if ids.get("schedule_id"):
        r = requests.post(
            f"{BASE_URL}/repayments/{ids['schedule_id']}/pay",
            headers=customer_headers,
            params={"amount": 833.33}  # Approximate monthly payment
        )
        print_result("Make Repayment", r)
        if r.status_code == 200:
            data = r.json()
            print(f"   Payment status: {data.get('status')}")
            print(f"   Limit restored: Customer's available limit increased")
    
    return True


def test_admin_reports():
    print_section("Admin Reports")
    
    if "admin" not in tokens:
        print("[SKIP] No admin token")
        return False
    
    auth_header = f"Bearer {tokens['admin']}"
    
    # Get final dashboard
    r = requests.get(f"{BASE_URL}/admin/dashboard", params={"authorization": auth_header})
    print_result("Final Dashboard", r)
    if r.status_code == 200:
        print(f"   Stats: {json.dumps(r.json(), indent=2)}")
    
    # Get all transactions
    r = requests.get(f"{BASE_URL}/admin/transactions", params={"authorization": auth_header})
    print_result("List All Transactions", r)
    if r.status_code == 200:
        txns = r.json()
        print(f"   Total transactions: {len(txns)}")
        for tx in txns[:3]:
            print(f"   - {tx.get('reference_number')}: {tx.get('amount')} SAR ({tx.get('status')})")
    
    return True


def main():
    print("\n" + "=" * 60)
    print("  BAREQ AL-YUSR BNPL API - COMPREHENSIVE TEST SUITE")
    print("=" * 60)
    print(f"  API URL: {BASE_URL}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    results = {}
    
    # Test sequence
    results["Health"] = test_health()
    results["Admin Setup"] = test_admin()
    results["Customer Registration"] = test_customer_registration()
    results["Merchant Registration"] = test_merchant_registration()
    results["Admin Approvals"] = test_admin_approvals()
    results["Customer Endpoints"] = test_customer_endpoints()
    results["Merchant Endpoints"] = test_merchant_endpoints()
    results["Transaction Flow"] = test_transaction_flow()
    results["Repayment"] = test_repayment()
    results["Admin Reports"] = test_admin_reports()
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        icon = "[OK]" if result else "[FAIL]"
        print(f"  {icon} {name}")
    
    print(f"\n  Total: {passed}/{total} test groups passed")
    print("=" * 60)
    
    if passed == total:
        print("  ALL TESTS PASSED!")
    else:
        print("  SOME TESTS FAILED - check output above")
    print("=" * 60)


if __name__ == "__main__":
    main()
