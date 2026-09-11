from pydantic import BaseModel
from typing import Optional


class BookResponse(BaseModel):
    id: str
    title: str
    filename: str
    storage_path: str
    file_size: Optional[int]
    current_page: int
    total_pages: int
    favorite: bool
    archived: bool


class UpdateProgressRequest(BaseModel):
    current_page: int