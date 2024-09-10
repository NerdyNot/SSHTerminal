import uvicorn
from fastapi import FastAPI, WebSocket, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from utils.connect_db import init_db, get_db
from utils.connect_websocket import websocket_handler
from utils.connect_auth import login_for_access_token, get_current_user

from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str
    
app = FastAPI()

# 정적 파일 서빙을 위한 경로 설정
app.mount("/assets", StaticFiles(directory="./dist/assets"), name="assets")
app.mount("/js", StaticFiles(directory="./dist/js"), name="js")

# 기본 경로에서 index.html 파일 서빙 (React Router의 entry point)
@app.get("/")
async def serve_index():
    return FileResponse("dist/index.html")

# 모든 경로에서 index.html 파일을 반환 (React Router를 위한 설정)
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    return FileResponse("dist/index.html")

# WebSocket 경로 설정 (/ws 경로를 사용)
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_handler(websocket)

# JWT 토큰을 발행하는 API 경로 (/api/token)
@app.post("/api/token")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    return login_for_access_token(request, db)

# 현재 사용자 정보를 가져오는 API 경로 (/api/users/me)
@app.get("/api/users/me")
async def read_users_me(current_user: str = Depends(get_current_user)):
    return current_user

# 데이터베이스 초기화
@app.on_event("startup")
def startup_event():
    init_db()

# FastAPI 애플리케이션 실행
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
