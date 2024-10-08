import os
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool
from passlib.context import CryptContext

# 비밀번호 해싱을 위한 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MySQL 환경 변수 설정
DB_USER = os.getenv("DB_USER", "user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "sshterminal")

# MySQL SQLAlchemy DATABASE_URL 생성
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# MongoDB 환경 변수 설정
MONGO_HOST = os.getenv("MONGO_HOST", "localhost")
MONGO_PORT = os.getenv("MONGO_PORT", "27017")
MONGO_DB = os.getenv("MONGO_DB", "ssh_sessions")
MONGO_URL = f"mongodb://{MONGO_HOST}:{MONGO_PORT}"

# MongoDB 클라이언트 생성
mongo_client = AsyncIOMotorClient(MONGO_URL)
mongo_db = mongo_client[MONGO_DB]

# SQLAlchemy 엔진 생성
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=3600,
)

# 세션을 위한 SessionLocal 설정
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 데이터베이스 모델을 위한 베이스 클래스
Base = declarative_base()

# 세션을 전역적으로 관리
def get_db():
    db = scoped_session(SessionLocal)
    try:
        yield db
    finally:
        db.remove()

# MongoDB 관련 함수 정의
def get_mongo_db():
    return mongo_db

# 모델 정의
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    userid = Column(String(50), unique=True, index=True, nullable=False)
    username = Column(String(50), nullable=False)
    userdescription = Column(String(255), nullable=True)
    hashed_password = Column(String(100), nullable=False)
    vault_mapping = Column(String(100), nullable=True)

# 데이터베이스 초기화 함수
def init_db():
    Base.metadata.create_all(bind=engine)
    add_default_admin()

# 기본 admin 계정을 추가하는 함수
def add_default_admin():
    db = scoped_session(SessionLocal)
    try:
        admin_user = db.query(User).filter(User.userid == "admin").first()
        if not admin_user:
            hashed_password = pwd_context.hash("adminpassword")
            new_admin = User(
                userid="admin",
                username="Admin",
                userdescription="Default admin user",
                hashed_password=hashed_password,
                vault_mapping=None
            )
            db.add(new_admin)
            db.commit()
            print("Default admin user created.")
        else:
            print("Admin user already exists.")
    except Exception as e:
        db.rollback()
        print(f"Failed to create admin user: {e}")
    finally:
        db.close()
