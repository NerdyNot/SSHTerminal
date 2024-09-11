import logging
from typing import List, Dict
from datetime import datetime, timezone
from utils.connect_db import get_mongo_db

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB 세션 컬렉션 가져오기
db = get_mongo_db()
sessions_collection = db['sessions']

async def get_logs_by_time(start_time: datetime, end_time: datetime) -> List[Dict]:
    # 로그 시작점 로깅
    logger.info(f"get_logs_by_time 호출됨. 시작 시간: {start_time}, 종료 시간: {end_time}")

    # 입력된 시간들이 offset-naive일 경우, UTC로 변환하여 offset-aware로 만듦
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)

    try:
        # session_connect_timestamp이 시간 범위 내에 있거나 아직 종료되지 않은 세션 조회
        sessions = await sessions_collection.find({
            '$or': [
                {'session_connect_timestamp': {'$gte': start_time, '$lte': end_time}},
                {'session_close_timestamp': {'$exists': False}},
                {'session_close_timestamp': {'$gte': end_time}}
            ]
        }).to_list(length=100)

        # MongoDB 조회 후 결과 로깅
        logger.info(f"MongoDB 조회 성공. 조회된 세션 수: {len(sessions)}")

        # 조회 결과 처리
        result = []
        for session in sessions:
            session_id = session.get('session_id')
            user_info = session.get('user_info')
            connect_time = session.get('session_connect_timestamp')
            close_time = session.get('session_close_timestamp', None)

            # 지정된 시간 범위에 속하는 로그만 필터링
            filtered_entries = [
                entry['data'] for entry in session.get('entries', []) 
                if 'timestamp' in entry and start_time <= entry['timestamp'].replace(tzinfo=timezone.utc) <= end_time
            ]

            # 로그 엔트리를 줄바꿈 없이 결합
            combined_data = "".join(filtered_entries)

            result.append({
                "session_connect_timestamp": connect_time,
                "session_close_timestamp": close_time,
                "session_id": session_id,
                "user_info": user_info,
                "data": combined_data
            })
        logger.info(f"반환 내용 : {result}")
        # 로그 데이터 처리 완료 로깅
        logger.info(f"로그 데이터 처리 완료. 반환할 세션 수: {len(result)}")

        return result
    
    except Exception as e:
        # 예외 발생 시 에러 로깅
        logger.error(f"로그 조회 중 오류 발생: {e}")
        return []
