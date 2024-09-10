import asyncio
import paramiko
from fastapi import WebSocket, WebSocketDisconnect
from asyncio.exceptions import TimeoutError

# SSH 연결을 설정하는 함수
async def ssh_connect(host: str, port: int, username: str, password: str):
    try:
        # SSH 클라이언트 설정
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy()) 

        # SSH 서버에 연결
        client.connect(hostname=host, port=port, username=username, password=password)
        
        # 터미널 세션을 요청
        session = client.invoke_shell()
        return client, session
    except Exception as e:
        return None, str(e)

# WebSocket 핸들러
async def websocket_handler(websocket: WebSocket):
    await websocket.accept()

    # 세션 타임아웃 시간 5분
    session_timeout = 300
    timeout_handle = None

    try:
        # WebSocket으로부터 SSH 연결 정보 받기
        data = await websocket.receive_json()
        host = data['host']
        port = int(data['port'])
        username = data['username']
        password = data['password']
        
        # SSH 연결 시도
        client, session = await ssh_connect(host, port, username, password)
        if not client:
            await websocket.send_text(f"SSH 연결 실패: {session}")
            await websocket.close()
            return
        
        await websocket.send_text("SSH 연결 성공!")

        # 세션에서 데이터를 읽고 WebSocket으로 전송
        async def read_from_ssh():
            while True:
                if session.recv_ready():
                    output = session.recv(1024).decode('utf-8')
                    await websocket.send_text(output)
                await asyncio.sleep(0.1)

        # 세션 타임아웃 처리 함수
        async def handle_timeout():
            nonlocal timeout_handle
            while True:
                try:
                    timeout_handle = await asyncio.wait_for(websocket.receive_text(), session_timeout)
                    session.send(timeout_handle)
                except TimeoutError:
                    await websocket.send_text("세션 타임아웃 발생. 연결을 종료합니다.")
                    websocket.close()
                    client.close()
                    break

        # WebSocket과 SSH 간의 데이터 송수신 및 타임아웃 처리
        asyncio.create_task(read_from_ssh())
        await handle_timeout()

    except WebSocketDisconnect:
        if client:
            client.close()
        print("WebSocket 연결 종료")
