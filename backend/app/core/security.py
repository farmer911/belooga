import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from pwdlib import PasswordHash

# Modern Argon2id password hash via pwdlib
password_hash_helper = PasswordHash.recommended()

SECRET_KEY = "belooga_dev_secret_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash_helper.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return password_hash_helper.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()
