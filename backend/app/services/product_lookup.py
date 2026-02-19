import httpx

API = "https://world.openfoodfacts.org/api/v0/product/"


async def lookup_product_name(barcode: str) -> dict:
    url = f"{API}{barcode}.json"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get(url)
            data = r.json()

        product = data.get("product", {})

        name = (
            product.get("product_name_de")
            or product.get("product_name")
            or product.get("brands")
        )

        if name:
            return {"name": name, "found": True}

    except Exception:
        pass

    return {"name": f"Produkt {barcode}", "found": False}
