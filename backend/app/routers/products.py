from fastapi import APIRouter

from app.services.product_lookup import lookup_product_name


router = APIRouter(tags=["products"])


@router.get("/products/lookup/{barcode}")
async def lookup_product(barcode: str):
    return await lookup_product_name(barcode)


@router.get("/lookup/{barcode}")
async def lookup_product_alias(barcode: str):
    return await lookup_product_name(barcode)
