from pydantic import BaseModel, EmailStr

class UserResponse(BaseModel):
    fullname: str
    email: EmailStr
    message: str
