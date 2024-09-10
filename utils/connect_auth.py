from datetime import timedelta, datetime
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from utils.connect_db import get_db, User
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

# 환경 변수에서 비밀 키 및 설정 값 로드
import os
SECRET_KEY = os.getenv("SECRET_KEY", "mysecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 비밀번호 해싱을 위한 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2PasswordBearer는 token 엔드포인트에 대한 경로를 기대합니다.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# 비밀번호 검증 함수
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 비밀번호 해싱 함수
def get_password_hash(password):
    return pwd_context.hash(password)

# 사용자를 DB에서 조회하는 함수
def get_user(db: Session, userid: str):
    return db.query(User).filter(User.userid == userid).first()

# 사용자를 인증하는 함수
def authenticate_user(db: Session, userid: str, password: str):
    user = get_user(db, userid)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

# JWT 토큰 생성 함수
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 현재 사용자 가져오기
def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        userid: str = payload.get("sub")
        if userid is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user(db, userid=userid)
    if user is None:
        raise credentials_exception
    return user

# JWT 토큰을 발행하는 함수
def login_for_access_token(request: LoginRequest, db: Session):
    user = authenticate_user(db, request.username, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.userid}, expires_delta=access_token_expires)
    
    # 사용자 정보와 함께 access_token 반환
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "userid": user.userid,
        "username": user.username,
        "userdescription": user.userdescription
    }