from typing import Annotated, Optional

import httpx
from fastapi import Header, HTTPException, status

from app.config import settings


async def require_user(authorization: Annotated[Optional[str], Header()] = None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    async with httpx.AsyncClient(timeout=10, trust_env=False) as client:
        response = await client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"apikey": settings.supabase_publishable_key, "Authorization": authorization},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    return response.json()
