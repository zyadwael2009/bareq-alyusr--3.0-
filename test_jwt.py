"""Quick test for JWT tokens"""
import sys
sys.path.insert(0, '.')

from app.utils.security import decode_token, create_access_token

# Test token creation
token_data = {'sub': 1, 'email': 'test@test.com', 'user_type': 'customer'}
token = create_access_token(token_data)
print('Token created:', token[:60] + '...')

# Test token decoding
decoded = decode_token(token)
print('Decoded payload:', decoded)

# Check if sub exists
print('sub value:', decoded.get('sub'))
print('type value:', decoded.get('type'))
