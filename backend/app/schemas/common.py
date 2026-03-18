from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar("T")


class SuccessResponse(BaseModel):
    """Standard success response wrapper."""
    success: bool = True
    message: str


class DataResponse(BaseModel, Generic[T]):
    """Standard data response wrapper."""
    success: bool = True
    data: T


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response wrapper."""
    success: bool = True
    data: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    message: str
    detail: Optional[str] = None