from fastapi import APIRouter
from app.product_lookup import lookup_product


router = APIRouter()


@router.get("/lookup/{barcode}")
def lookup(barcode: str):
    return lookup_product(barcode)
