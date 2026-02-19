from fastapi import APIRouter
from product_lookup import lookup_product

router = APIRouter()


@router.get("/products/lookup/{barcode}")
async def lookup(barcode: str):
    return await lookup_product(barcode)
