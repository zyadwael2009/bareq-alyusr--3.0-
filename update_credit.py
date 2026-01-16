from app.database import SessionLocal
from app.models.user import User
from app.models.customer import Customer

db = SessionLocal()
user = db.query(User).filter(User.email == 'zyadwael2009@gmail.com').first()

if user:
    print(f'Found user: {user.full_name} (ID: {user.id})')
    customer = db.query(Customer).filter(Customer.user_id == user.id).first()
    if customer:
        customer.credit_limit = 5000.0
        customer.available_limit = 5000.0
        customer.is_approved = True
        db.commit()
        print(f'Updated customer {customer.id}:')
        print(f'  - Credit limit: {customer.credit_limit}')
        print(f'  - Available limit: {customer.available_limit}')
        print(f'  - Is approved: {customer.is_approved}')
    else:
        print('Customer profile not found')
else:
    print('User not found')

db.close()
