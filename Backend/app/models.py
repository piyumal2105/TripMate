from pydantic import BaseModel, EmailStr

class User(BaseModel):
    fullname: str
    email: EmailStr
    password: str
