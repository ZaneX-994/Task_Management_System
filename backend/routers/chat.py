from fastapi import APIRouter, HTTPException, WebSocket, Depends
from typing import List, Dict
from utility import get_db_conn, oauth2_scheme, verify_token
from datetime import datetime
import json
from psycopg2 import extras


router = APIRouter()
connected_clients: Dict[int, List[WebSocket]] = {}

@router.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: int):
    
    await websocket.accept()
    
    # initialized list for given task_id if not exist already
    if task_id not in connected_clients:
        connected_clients[task_id] = []
    
    connected_clients[task_id].append(websocket)
    
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        while True:
            # receive data from user
            data = await websocket.receive_text()
            message = json.loads(data)
            content = message.get('content')
            profile_id = message.get('profile_id')
            currentTime = datetime.now()
            # save messages
            saveMessageSQL = """
            INSERT INTO MESSAGES (profile_id, task_id, content, time_send)
            VALUES (%s, %s, %s, %s);
            """
            cur.execute(saveMessageSQL, (profile_id, task_id, content, currentTime))
            conn.commit()

            cur.execute("SELECT image, first_name FROM PROFILES WHERE id = %s", (profile_id,))
            result = cur.fetchone()
            image = None
            first_name = None
            
            if result is not None:
                image = result[0]  # Access the first column of the result
                first_name = result[1]  # Access the second column of the result

            # propagate text message to relavent users
            for client in connected_clients[task_id]:
                await client.send_text(json.dumps({"profile_id": profile_id, "content": content, 
                        "image": image, "first_name": first_name}))
        
    except Exception as e:
        print(e)
    finally:
        cur.close()
        conn.close()
        connected_clients[task_id].remove(websocket)


@router.get("/messages")
async def get_messages(task_id: int, token: str = Depends(oauth2_scheme)):
    user_id = verify_token(token)
    
    # get messages in order of sending time
    fetch_messageSQL = """
    SELECT m.content as content, p.id as profile_id, p.first_name, p.image from MESSAGES m
        JOIN TASKS t ON t.id = m.task_id
        JOIN PROFILES p on p.id = m.profile_id
    WHERE t.id = %s
    ORDER BY m.time_send
    """
    conn = get_db_conn()
    cur = conn.cursor(cursor_factory=extras.DictCursor)
    
    cur.execute(fetch_messageSQL, (task_id,))
    result = cur.fetchall()
    messages = [dict(row) for row in result]

    cur.close()
    conn.close()
    
    return messages



