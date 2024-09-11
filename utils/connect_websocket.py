import asyncio
import paramiko
import datetime
from fastapi import WebSocket, WebSocketDisconnect
from utils.connect_db import get_mongo_db
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB 연결 설정
mongo_db = get_mongo_db()
sessions_collection = mongo_db['sessions']

# SSH 연결을 설정하는 함수
async def ssh_connect(host: str, port: int, username: str, password: str):
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=host, port=port, username=username, password=password)
        session = client.invoke_shell()
        return client, session
    except paramiko.AuthenticationException:
        logger.error(f"SSH 인증 실패: {username}@{host}")
        return None, "Authentication failed"
    except Exception as e:
        logger.error(f"SSH 연결 오류: {e}")
        return None, str(e)

# WebSocket 핸들러
async def websocket_handler(websocket: WebSocket):
    await websocket.accept()

    client = None
    session = None
    session_id = str(datetime.datetime.utcnow().timestamp())
    session_log = {
        'session_id': session_id,
        'user_info': None,
        'entries': [],
        'session_connect_timestamp': datetime.datetime.utcnow(),
        'session_close_timestamp': None
    }

    try:
        data = await websocket.receive_json()
        user_info = data['user_info']
        host = data['host']
        port = int(data['port'])
        username = data['username']
        password = data['password']

        session_log['user_info'] = user_info

        # MongoDB에 세션 문서 생성 및 user_info 저장
        await sessions_collection.insert_one(session_log)

        # SSH 연결 시도
        client, session = await ssh_connect(host, port, username, password)
        if not client:
            logger.error(f"SSH 연결 실패: {username}@{host}")
            await websocket.send_text(f"SSH 연결 실패: {session}")

            # 실패 로그 기록
            failure_log = {
                'timestamp': datetime.datetime.utcnow(),
                'data': f"SSH 연결 실패: {session}"
            }
            session_log['entries'].append(failure_log)
            await sessions_collection.update_one(
                {'session_id': session_id},
                {'$push': {'entries': failure_log}}
            )

            # 연결 실패 시에도 session_close_timestamp를 기록
            await sessions_collection.update_one(
                {'session_id': session_id},
                {'$set': {'session_close_timestamp': datetime.datetime.utcnow()}}
            )
            await websocket.close()
            return
        
        logger.info(f"SSH 연결 성공: {username}@{host}")
        await websocket.send_text("SSH 연결 성공!")

        # 성공 로그 기록
        success_log = {
            'timestamp': datetime.datetime.utcnow(),
            'data': "SSH 연결 성공!"
        }
        session_log['entries'].append(success_log)
        await sessions_collection.update_one(
            {'session_id': session_id},
            {'$push': {'entries': success_log}}
        )

        # SSH 세션에서 데이터를 읽고 WebSocket으로 전송
        async def read_from_ssh():
            while True:
                if session.recv_ready():
                    output = session.recv(1024).decode('utf-8')
                    entry = {
                        'timestamp': datetime.datetime.utcnow(),
                        'data': output
                    }
                    session_log['entries'].append(entry)
                    await sessions_collection.update_one(
                        {'session_id': session_id},
                        {'$push': {'entries': entry}},
                        upsert=True
                    )
                    await websocket.send_text(output)
                await asyncio.sleep(0.1)

        # 세션 타임아웃 처리 함수
        async def handle_timeout():
            while True:
                try:
                    timeout_handle = await asyncio.wait_for(websocket.receive_text(), timeout=300)
                    session.send(timeout_handle)
                except asyncio.TimeoutError:
                    logger.warning(f"세션 타임아웃: {username}@{host}")
                    await websocket.send_text("세션 타임아웃 발생. 연결을 종료합니다.")
                    await websocket.close()
                    if client:
                        client.close()

                    # 타임아웃 로그 기록
                    timeout_log = {
                        'timestamp': datetime.datetime.utcnow(),
                        'data': "세션 타임아웃으로 종료됨."
                    }
                    session_log['entries'].append(timeout_log)
                    await sessions_collection.update_one(
                        {'session_id': session_id},
                        {'$push': {'entries': timeout_log},
                         '$set': {'session_close_timestamp': datetime.datetime.utcnow()}}
                    )
                    break

        # WebSocket과 SSH 간의 데이터 송수신 및 타임아웃 처리
        asyncio.create_task(read_from_ssh())
        await handle_timeout()

    except WebSocketDisconnect:
        logger.info(f"WebSocket 연결 종료: {username}@{host}")
        if client:
            client.close()

        # WebSocket 종료 로그 기록
        disconnect_log = {
            'timestamp': datetime.datetime.utcnow(),
            'data': "WebSocket 연결 종료됨."
        }
        session_log['entries'].append(disconnect_log)
        await sessions_collection.update_one(
            {'session_id': session_id},
            {'$push': {'entries': disconnect_log},
             '$set': {'session_close_timestamp': datetime.datetime.utcnow()}}
        )
        logger.info(f"세션 종료 기록: {session_id}")
