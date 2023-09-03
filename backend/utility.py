import psycopg2
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "6b4f6ee73021eef5a7ec638de18f83461b91fb0a778033f19111364113bcdfb8"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 45

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
def get_db_conn():
    conn = psycopg2.connect(
        dbname="endgame",
        user="teamendgame",
        host="localhost",
        password="password"
    )
    return conn


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        id: str = payload.get("sub")
        if id is None:
            raise HTTPException(status_code=401)
        return id
    except JWTError:
        raise HTTPException(status_code=401)
