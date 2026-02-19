from fastapi import APIRouter

from services.product_lookup import lookup_barcode


router = APIRouter(prefix="/products", tags=["products"])


@router.get("/lookup/{barcode}")
async def lookup_product(barcode: str):
    return await lookup_barcode(barcode)
