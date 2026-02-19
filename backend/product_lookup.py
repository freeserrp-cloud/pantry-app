import httpx

OFF_URL = "https://world.openfoodfacts.org/api/v0/product/"
UPC_URL = "https://api.upcitemdb.com/prod/trial/lookup?upc="


async def lookup_product(barcode: str):
    # 1️⃣ OpenFoodFacts (primary)
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{OFF_URL}{barcode}.json")
            data = r.json()

        if data.get("status") == 1:
            p = data.get("product", {})
            name = p.get("product_name") or p.get("generic_name")
            image = p.get("image_front_url")

            if name:
                return {
                    "name": name,
                    "image": image,
                    "found": True
                }
    except Exception as e:
        print("OpenFoodFacts failed:", e)

    # 2️⃣ UPCItemDB fallback
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{UPC_URL}{barcode}")
            data = r.json()

        items = data.get("items")
        if items:
            item = items[0]
            return {
                "name": item.get("title"),
                "image": (item.get("images") or [None])[0],
                "found": True
            }
    except Exception as e:
        print("UPC fallback failed:", e)

    # 3️⃣ Final fallback
    return {
        "name": f"Produkt {barcode}",
        "image": None,
        "found": False
    }
