from fastapi import APIRouter, Depends
from typing import List

from app.database import get_db
from app.models.merchant import MerchantResponse

router = APIRouter()


@router.get("/merchants", response_model=List[MerchantResponse])
async def list_merchants(db=Depends(get_db)):
    """List all active merchants."""
    cursor = db.cursor()
    cursor.execute(
        "SELECT * FROM merchants WHERE is_active = true ORDER BY name ASC"
    )
    merchants = cursor.fetchall()
    return merchants
