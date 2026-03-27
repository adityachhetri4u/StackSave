from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class MerchantResponse(BaseModel):
    id: UUID
    name: str
    category: str
    is_active: bool

    class Config:
        from_attributes = True
