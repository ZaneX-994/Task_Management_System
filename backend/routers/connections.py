from fastapi import APIRouter, HTTPException, Depends, status
from typing import Union
from utility import get_db_conn, oauth2_scheme, verify_token
from pydantic import BaseModel
from typing import List, Union, Optional
from pydantic import BaseModel
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

router = APIRouter()

class Connection_request_Management(BaseModel):
    sender_id: int
    decision: bool

class Send_Request(BaseModel):
    email: str
    
# use to notify the user via email
def send_email(to: str, body):
    subject = "Connection Request"
    message = MIMEMultipart()
    message["From"] = "Connection Request Notification"
    message["To"] = to
    message["Subject"] = subject

    # Add body to email
    message.attach(MIMEText(body, "plain"))

    text = message.as_string()

    # Log in to server using secure context and send email
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login("msgsend1@gmail.com", "oniniqkytxhpxwhv")
        server.sendmail("msgsend1@gmail.com", to, text)
        
# send the connection request to another task master
@router.post("/connection_request")
def send_connection_request(Send: Send_Request, token: str = Depends(oauth2_scheme)):
    email = Send.email
    
    id1 = verify_token(token)
    
    conn = get_db_conn()
    cur = conn.cursor()
    
    # Check if the email is valid
    cur.execute("SELECT id FROM profiles WHERE email_address=%s", (email,))
    
    id2 = cur.fetchone()
    
    if id2 is None:
        raise HTTPException(status_code=400, detail="Email does not Exist")
    if int(id1) == int(id2[0]):
        raise HTTPException(status_code=405, detail="Connection can not self directed")
    
    # Check if the user is already connected
    connectionCheckSQL = """
        SELECT * FROM CONNECTIONS
        WHERE id1 = %s AND id2 = %s
        
        UNION
        
        SELECT * FROM CONNECTIONS
        WHERE id2 = %s AND id1 = %s
    """
    cur.execute(connectionCheckSQL, (id1, id2, id1, id2))
    result = cur.fetchone()
    
    if result is not None:
        raise HTTPException(status_code=409, detail="Connected Already")
    
    # Send the connection request
    add_connection_request = """
        INSERT INTO connection_requests (sender_id, receiver_id)
        VALUES (%s, %s)
    """
    cur.execute(add_connection_request, (id1, id2))
    
    conn.commit()
    
    # send email notification to notify the connection request   
    cur.execute("SELECT \
                first_name || ' ' || last_name as name FROM PROFILES WHERE id = %s", 
                (id1,))
    

    sender_name = cur.fetchone()
    msg_body = f"Hi! \nYour have a connection request from {sender_name} with id: {id1}."
    send_email(email, msg_body)
    
    
    cur.close()
    conn.close()
    
    return {'sender_id': id1,
            'receiver_id': id2}

# manage request connection
@router.post("/connection_request_management")
def manage_connection_request(management: Connection_request_Management, token: str = Depends(oauth2_scheme)):
    
    receiver_id = verify_token(token)
    sender_id = management.sender_id
    decision = management.decision
    
    conn = get_db_conn()
    cur = conn.cursor()
    
    cur.execute("SELECT \
                email_address, first_name || ' ' || last_name as name FROM PROFILES WHERE id = %s", 
                (sender_id,))
    sender_email, _ = cur.fetchone()
    
    cur.execute("SELECT \
                email_address, first_name || ' ' || last_name as name FROM PROFILES WHERE id = %s", 
                (receiver_id,))
    _, receiver_name = cur.fetchone()
    
    # either establish or reject connection the request should be removed
    RemoveRequestRecordSQL = """
        DELETE FROM CONNECTION_REQUESTS 
        WHERE sender_id = %s AND receiver_id = %s
    """
    
    cur.execute(RemoveRequestRecordSQL, (sender_id, receiver_id))
    
    # connection is declined
    if decision is False:
        msg_body = f"Hi! \nYour connection request to {receiver_name} with id: {receiver_id} is failed."
    
    # connection is accpeted
    elif decision is True:
        EstablishConnectionSQL = """
            INSERT INTO CONNECTIONS (id1, id2)
            VALUES (%s, %s)
        """
        cur.execute(EstablishConnectionSQL, (sender_id, receiver_id))
        
        msg_body = f"Hi! \nYour connection request to {receiver_name} with id: {receiver_id} is successfull."
    
    send_email(sender_email, msg_body)
    cur.execute(RemoveRequestRecordSQL, (sender_id, receiver_id))
    
    conn.commit()
    
    cur.close()
    conn.close()
    
    return {'sender_id': sender_id,
            'receiver_id': receiver_id}

# return connection list
@router.get("/connections")
def get_connections(token: str = Depends(oauth2_scheme)):
    user_id = verify_token(token)
    
    connection_list = []
    
    get_connectionsSql = """
        SELECT 
        p.id as u_id, p.email_address as email, p.first_name as first_name, p.last_name as last_name, p.image as image
        FROM profiles p
            JOIN CONNECTIONS c on c.id2 = p.id
        WHERE c.id1 = %s
        
        UNION
        
        SELECT 
        p.id as id, p.email_address as email, p.first_name as first_name, p.last_name as last_name, p.image as image
        FROM profiles p
            JOIN CONNECTIONS c on c.id1 = p.id
        WHERE c.id2 = %s
    """
    
    conn = get_db_conn()
    cur = conn.cursor()
    
    cur.execute(get_connectionsSql, (user_id, user_id))
    records = cur.fetchall()
    
    col_names = [desc[0] for desc in cur.description]
    
    for record in records:
        record_dict = dict(zip(col_names, record))
        connection_list.append(record_dict)
    
    cur.close()
    conn.close()

    return {'connection_list': connection_list}

# return connection request list
@router.get("/connection_requests")
def get_connection_requests(token: str = Depends(oauth2_scheme)):
    user_id = verify_token(token)
    
    connectionRequests_list = []
    
    get_connectionsSql = """
        SELECT 
        p.id as u_id, p.email_address as email, p.first_name as first_name, p.last_name as last_name, p.image as image
        FROM profiles p
            JOIN CONNECTION_REQUESTS c on c.sender_id = p.id
        WHERE c.receiver_id = %s
    """
    
    conn = get_db_conn()
    cur = conn.cursor()
    
    cur.execute(get_connectionsSql, (user_id,))
    records = cur.fetchall()
    
    col_names = [desc[0] for desc in cur.description]
    
    for record in records:
        record_dict = dict(zip(col_names, record))
        connectionRequests_list.append(record_dict)
    
    cur.close()
    conn.close()

    return {'request_list': connectionRequests_list}

# delete connection
@router.delete("/delete_connection")
def delete_connection(profile_id: int, token: str = Depends(oauth2_scheme)):
    
    user_id = verify_token(token)
    
    deleteConnectionSQL = """
        DELETE FROM CONNECTIONS 
        WHERE (id1 = %s AND id2 = %s) OR (id1 = %s AND id2 = %s);
    """
    
    conn = get_db_conn()
    cur = conn.cursor()
    
    cur.execute(deleteConnectionSQL, (user_id, profile_id, profile_id, user_id))
    
    conn.commit()

    cur.close()
    conn.close()
    
    return {}