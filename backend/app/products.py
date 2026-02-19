from fastapi import APIRouter
from product_lookup import lookup_product

router = APIRouter()


@router.get("/products/lookup/{barcode}")
def lookup(barcode: str):
    return lookup_product(barcode)


@router.get("/lookup/{barcode}")
def lookup_alias(barcode: str):
    return lookup_product(barcode)
