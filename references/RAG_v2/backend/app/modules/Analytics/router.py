from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from .service import get_dashboard_data

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

@router.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    print("NEW ROUTER IS RUNNING")
    print("========== DASHBOARD data ==========")
    data = await get_dashboard_data(user.id)
    print(data)
    print("========== DASHBOARD HIT ==========")
    print("USER:", user.id)

    return await get_dashboard_data(user.id)

@router.get("/ping")
async def ping():
    return {"message": "Backend is working!"}