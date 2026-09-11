from app.core.supabase_client import supabase
from fastapi import HTTPException, Header
from typing import Optional
from fastapi import Request

print("AUTH MODULE LOADED")

async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    print("Authorization:", authorization)

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")

    print("TOKEN START:", token[:30])

    try:
        response = supabase.auth.get_user(token)

        print("SUPABASE RESPONSE:", response)

        return response.user

    except Exception as e:
        print("AUTH ERROR:", repr(e))
        raise HTTPException(status_code=401, detail="Invalid token")