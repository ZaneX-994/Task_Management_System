from fastapi import APIRouter, HTTPException, Depends, status
from typing import Union
from utility import get_db_conn, oauth2_scheme
from datetime import datetime, timedelta, date
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import os

router = APIRouter()

#-------------------REGO-----------------
class RegisterProfile(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str
    dob: str

@router.post("/register")
async def register(user: RegisterProfile):
    conn = get_db_conn()
    cur = conn.cursor()

    cur.execute("SELECT * FROM profiles WHERE email_address=%s", (user.email,))
    if cur.fetchone() is not None:
        raise HTTPException(status_code=400, detail="Email already in use")

    password_hash = get_password_hash(user.password)
    
    cur.execute("INSERT INTO profiles (email_address, first_name, last_name, date_of_birth, password_hash) \
                VALUES (%s, %s, %s, %s, %s)", (user.email, user.first_name, user.last_name, user.dob, password_hash))
    conn.commit()
    cur.close()
    conn.close()

    return {"detail": "User registered"}

#------------------AUTH-----------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "6b4f6ee73021eef5a7ec638de18f83461b91fb0a778033f19111364113bcdfb8"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 45


def verify_password(password, password_hash):
    return pwd_context.verify(password, password_hash)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_profile_password_hash(email):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT password_hash from PROFILES where email_address=%s", (email,))
    password_hash = cur.fetchone()
    if password_hash is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Profile not found")
    return password_hash[0]

def authenticate_profile(email: str, password: str):
    password_hash = get_profile_password_hash(email)
    if not verify_password(password, password_hash):
        return False
    return email

class Token(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        profile_id: str = payload.get("sub")
        if profile_id is None:
            raise HTTPException(status_code=401)
        return profile_id
    except JWTError:
        raise HTTPException(status_code=401)

class LoginData(BaseModel):
    email: str
    password: str

@router.post("/token", response_model=Token)
def login_for_access_token(login_data: LoginData):
    email = authenticate_profile(login_data.email, login_data.password)
    conn = get_db_conn()
    cur = conn.cursor()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    cur.execute("SELECT id FROM PROFILES WHERE email_address=%s", (email,))
    profile_id = cur.fetchone()
    cur.close()
    conn.close()

    access_token = create_access_token(
        data={"sub": str(profile_id[0])}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/token/id")
async def read_profile(token: str = Depends(oauth2_scheme)):
    return verify_token(token)


# ---------- Logout



# ---------- PROFILE


def get_profile(profile_id: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT first_name, last_name, email_address, date_of_birth, image FROM PROFILES WHERE id=%s", (profile_id,))
    profile = cur.fetchone()
    cur.close()
    conn.close()

    if profile is None:
        raise HTTPException(status_code=405)
    
    first_name, last_name, email_address, date_of_birth, image = profile
    
    if image is None:

        with open("routers/message.txt", "r") as f:
            image = f.read()
            
    profile_dict = {
        'profile_id': profile_id,
        'first_name': first_name,
        'last_name': last_name,
        'email': email_address,
        'date_of_birth': date_of_birth,
        'image': image
    }
    
    return profile_dict

class UserProfile(BaseModel):
    image: Union[str, None]
    profile_id: Union[int, None]
    first_name: Union[str, None]
    last_name: Union[str, None]
    email: Union[str, None]
    date_of_birth: Union[date, None]

@router.get("/profile", response_model=UserProfile)
async def read_profile(profile_id: Union[str, None], token: str = Depends(oauth2_scheme)):
    profile_id = profile_id if profile_id != None else verify_token(token)
    # conn = get_db_conn()
    # cur = conn.cursor()
    # cur.execute("SELECT email_address from profiles WHERE id=%s", (profile_id,))
    # email = cur.fetchone()[0]
    # cur.close()
    # conn.close()

    # TODO CHECK IF CONNECTED OR SELF
    return get_profile(profile_id)

@router.put("/edit_profile")
async def edit_profile(UserProfile: UserProfile, token: str = Depends(oauth2_scheme)):
    user_id = verify_token(token)
    
    args = []
    requests = []
    for tup in UserProfile:
        if tup[1] is not None:
            args.append(tup[1])
            requests.append(tup[0])
    
    updateProfileSQL = '''
        UPDATE PROFILES
        SET
    '''
    
    for column in requests:
        updateProfileSQL += f" {column} = %s,"
        
    updateProfileSQL = updateProfileSQL[:-1]
    updateProfileSQL += '\nWHERE id = %s'
    args.append(user_id)
    
    conn = get_db_conn()
    cur = conn.cursor()
    
    cur.execute(updateProfileSQL, tuple(args))
    
    conn.commit()
    cur.close() 
    conn.close()
    
    return {"detail": "Profile updated successfully"}

# PROFILE SCORING
@router.get("/profile/score")
async def profile_score(profile_id : Union[str, None], token: str = Depends(oauth2_scheme)):
    conn = get_db_conn()
    cur = conn.cursor()

    profile_id = profile_id if profile_id != None else verify_token(token)

    single_profile_score_select = """
    WITH max_weight AS (
    SELECT 
        MAX(total_task_weight) AS max_total_task_weight
    FROM (
        SELECT 
            profiles.id AS profile_id,
            COALESCE(SUM(subquery.task_weight), 0) AS total_task_weight
        FROM 
            profiles
        LEFT JOIN (
                SELECT 
                    task_assignees.profile_id,
                    COALESCE(tasks.mean, 45) * 
                        CASE 
                            WHEN tasks.progress = 'Not Started' THEN 1
                            WHEN tasks.progress = 'In Progress' THEN 0.5
                            WHEN tasks.progress = 'Completed' THEN 0
                            WHEN tasks.progress = 'Blocked' THEN 0
                        END *
                        (1/GREATEST(EXTRACT(DAY FROM AGE(tasks.deadline, CURRENT_DATE)), 1)::float) *
                        (1/GREATEST(0.75 + 0.25/COUNT(task_assignees.profile_id) OVER (PARTITION BY tasks.id), 1)::float) AS task_weight
                FROM 
                    task_assignees
                LEFT JOIN
                    tasks ON task_assignees.task_id = tasks.id
            ) AS subquery ON profiles.id = subquery.profile_id
        GROUP BY
            profiles.id
        ) AS subquery
    )

    SELECT 
        CASE 
            WHEN max_weight.max_total_task_weight = 0 THEN 0
            ELSE COALESCE(SUM(subquery.task_weight), 0) / max_weight.max_total_task_weight
        END AS total_task_weight_ratio
    FROM 
        profiles
    LEFT JOIN (
        SELECT 
            task_assignees.profile_id,
            COALESCE(tasks.mean, 45) * 
                CASE 
                    WHEN tasks.progress = 'Not Started' THEN 1
                    WHEN tasks.progress = 'In Progress' THEN 0.5
                    WHEN tasks.progress = 'Completed' THEN 0
                    WHEN tasks.progress = 'Blocked' THEN 0
                END *
                (1/GREATEST(EXTRACT(DAY FROM AGE(tasks.deadline, CURRENT_DATE)), 1)::float) *
                (1/GREATEST(0.75 + 0.25/COUNT(task_assignees.profile_id) OVER (PARTITION BY tasks.id), 1)::float) AS task_weight
        FROM 
            task_assignees
        LEFT JOIN
            tasks ON task_assignees.task_id = tasks.id
    ) AS subquery ON profiles.id = subquery.profile_id,
    max_weight
    WHERE 
        profiles.id = %s
    GROUP BY
        profiles.id,
        max_weight.max_total_task_weight;

    """

    cur.execute(single_profile_score_select, (profile_id,))
    score = round(cur.fetchone()[0] * 100)
    cur.close()
    conn.close()
    return score


multiprofilescore_select = """
WITH max_weight AS (
    SELECT 
        MAX(total_task_weight) AS max_total_task_weight
    FROM (
        SELECT 
            profiles.id AS profile_id,
            COALESCE(SUM(subquery.task_weight), 0) AS total_task_weight
        FROM 
            profiles
        LEFT JOIN (
                SELECT 
                    task_assignees.profile_id,
                    COALESCE(tasks.mean, 45) * 
                        CASE 
                            WHEN tasks.progress = 'Not Started' THEN 1
                            WHEN tasks.progress = 'In Progress' THEN 0.5
                            WHEN tasks.progress = 'Completed' THEN 0
                            WHEN tasks.progress = 'Blocked' THEN 0
                        END *
                        (1/GREATEST(EXTRACT(DAY FROM AGE(tasks.deadline, CURRENT_DATE)), 1)::float) *
                        (1/GREATEST(0.75 + 0.25/COUNT(task_assignees.profile_id) OVER (PARTITION BY tasks.id), 1)::float) AS task_weight
                FROM 
                    task_assignees
                LEFT JOIN
                    tasks ON task_assignees.task_id = tasks.id
            ) AS subquery ON profiles.id = subquery.profile_id
        GROUP BY
            profiles.id
    ) AS subquery
)

SELECT 
    profiles.id,
    CASE 
        WHEN max_weight.max_total_task_weight = 0 THEN 0
        ELSE COALESCE(SUM(subquery.task_weight), 0) / max_weight.max_total_task_weight
    END AS total_task_weight_ratio
FROM 
    profiles
LEFT JOIN (
    SELECT 
        task_assignees.profile_id,
        COALESCE(tasks.mean, 45) * 
            CASE 
                WHEN tasks.progress = 'Not Started' THEN 1
                WHEN tasks.progress = 'In Progress' THEN 0.5
                WHEN tasks.progress = 'Completed' THEN 0
                WHEN tasks.progress = 'Blocked' THEN 0
            END *
            (1/GREATEST(EXTRACT(DAY FROM AGE(tasks.deadline, CURRENT_DATE)), 1)::float) *
            (1/GREATEST(0.75 + 0.25/COUNT(task_assignees.profile_id) OVER (PARTITION BY tasks.id), 1)::float) AS task_weight
    FROM 
        task_assignees
    LEFT JOIN
        tasks ON task_assignees.task_id = tasks.id
) AS subquery ON profiles.id = subquery.profile_id,
max_weight
WHERE 
    profiles.id IN (%s)
GROUP BY
    profiles.id,
    max_weight.max_total_task_weight;

    """

@router.get("/profile/scores/")
async def get_scores(get_connected: Union[bool, None], token: str = Depends(oauth2_scheme)):
    get_scores = []
    user_id = verify_token(token)
    conn = get_db_conn()
    cur = conn.cursor()

    if get_connected != None:
        query = "SELECT id2 FROM connections WHERE id1 = %s UNION SELECT id1 FROM connections WHERE id2 = %s"    
        cur.execute(query, (user_id, user_id,))
        rows = cur.fetchall()
        for row in rows:
            get_scores.append(row[0])

    # print(get_scores)
    if len(get_scores) == 0: # This one, return empty list before running the query
        return {"scores": []}

    placeholders = ', '.join(['%s'] * len(get_scores))
    query = multiprofilescore_select.replace('%s', placeholders)
    cur.execute(query, get_scores)

    # score = cur.fetchone()[0] * 100
    scores = cur.fetchall()
    scores = [{"profile_id": pair[0], "score": round(pair[1]*100)} for pair in scores]
    # print(f"SCORES : {scores}")
    cur.close()
    conn.close()
    return {"scores": scores}



    # if get_connected != None:
    #     query = "SELECT id2 FROM connections WHERE id1 = %s UNION SELECT id1 FROM connections WHERE id2 = %s"    
    #     cur.execute(query, (user_id, user_id,))
    #     rows = cur.fetchall()
    #     for row in rows:
    #         get_scores.append(row[0])

    # # print(get_scores)
    # placeholders = ', '.join(['%s'] * len(get_scores))
    # query = multiprofilescore_select.replace('%s', placeholders)
    # cur.execute(query, get_scores)