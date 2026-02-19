import httpx

OPENFOODFACTS_URL = "https://world.openfoodfacts.org/api/v0/product/"


async def lookup_product(barcode: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(f"{OPENFOODFACTS_URL}{barcode}.json")

        if res.status_code != 200:
            return fallback(barcode)

        data = res.json()

        if data.get("status") != 1:
            return fallback(barcode)

        product = data.get("product", {})

        name = (
            product.get("product_name")
            or product.get("product_name_de")
            or product.get("generic_name")
        )

        brand = product.get("brands")

        image = (
            product.get("image_front_url")
            or product.get("image_url")
        )

        return {
            "name": name or f"Produkt {barcode}",
            "brand": brand,
            "image": image,
            "found": bool(name),
        }

    except Exception:
        return fallback(barcode)


def fallback(barcode: str) -> dict:
    return {
        "name": f"Produkt {barcode}",
        "brand": None,
        "image": None,
        "found": False,
    }
