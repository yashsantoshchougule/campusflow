from fastapi import APIRouter, UploadFile, File, Depends

from app.core.auth import get_current_user

from .service import (
    upload_book,
    get_books,
    get_book,
    delete_book,
    update_progress,
    update_last_opened,
)

from app.modules.books.schemas import UpdateProgressRequest

router = APIRouter(
    prefix="/books",
    tags=["Study Library"],
)


@router.get("/test")
async def test_auth(
    user=Depends(get_current_user),
):
    return {
        "message": "Books auth works",
        "user_id": user.id,
    }

@router.get("/public")
async def public():
    return {"message": "Books router is working"}


@router.post("/")
async def create_book(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    return await upload_book(file, user.id)


@router.get("/")
async def fetch_books(
    user=Depends(get_current_user),
):
    return await get_books(user.id)



@router.get("/{book_id}")
async def fetch_book(
    book_id: str,
    user=Depends(get_current_user),
):
    return await get_book(book_id, user.id)

@router.delete("/{book_id}")
async def remove_book(
    book_id: str,
    user=Depends(get_current_user),
):
    return await delete_book(book_id, user.id)


@router.patch("/{book_id}/progress")
async def update_book_progress(
    book_id: str,
    request: UpdateProgressRequest,
    user=Depends(get_current_user),
):
    return await update_progress(
        book_id,
        request.current_page,
        user.id,
    )

@router.patch("/{book_id}/open")
async def open_book(
    book_id: str,
    user=Depends(get_current_user),
):
    return await update_last_opened(
        book_id,
        user.id,
    )