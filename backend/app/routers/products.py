from fastapi import APIRouter

from app.services.product_lookup import fetch_product_from_openfoodfacts


router = APIRouter(tags=["products"])


@router.get("/products/lookup/{barcode}")
def lookup_product(barcode: str):
    return fetch_product_from_openfoodfacts(barcode)


@router.get("/lookup/{barcode}")
def lookup_product_alias(barcode: str):
    return fetch_product_from_openfoodfacts(barcode)
