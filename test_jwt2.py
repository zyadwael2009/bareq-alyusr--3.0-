"""Quick test for JWT tokens"""
import sys
sys.path.insert(0, '.')

from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.config import settings

print("SECRET_KEY:", settings.SECRET_KEY[:20] + "...")
print("ALGORITHM:", settings.ALGORITHM)

# Test token creation manually
data = {'sub': 1, 'email': 'test@test.com', 'user_type': 'customer'}
to_encode = data.copy()
expire = datetime.utcnow() + timedelta(minutes=30)
to_encode.update({"exp": expire, "type": "access"})

token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
print("Token created:", token[:60] + "...")

# Test token decoding
try:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    print("Decoded successfully:", payload)
except JWTError as e:
    print("Decode error:", e)
except Exception as e:
    print("Other error:", type(e), e)
