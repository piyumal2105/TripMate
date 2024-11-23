from fastapi import FastAPI, HTTPException
from app.models import User
from app.auth import register_user, login_user

app = FastAPI()

@app.post("/register")
async def register(user: User):
    return register_user(user.email, user.password)

@app.post("/login")
async def login(user: User):
    return login_user(user.email, user.password)
