import requests

OFF_URL = "https://world.openfoodfacts.org/api/v0/product/"
UPC_URL = "https://api.upcitemdb.com/prod/trial/lookup?upc="


def lookup_product(barcode: str):
    # 1️⃣ OpenFoodFacts
    try:
        r = requests.get(f"{OFF_URL}{barcode}.json", timeout=5)
        data = r.json()

        if data.get("status") == 1:
            product = data.get("product", {})
            name = product.get("product_name") or product.get("generic_name")
            image = product.get("image_front_url")

            if name:
                return {
                    "name": name,
                    "image": image,
                    "found": True
                }
    except Exception as e:
        print("OFF failed:", e)

    # 2️⃣ UPC fallback
    try:
        r = requests.get(f"{UPC_URL}{barcode}", timeout=5)
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
        print("UPC failed:", e)

    # fallback
    return {
        "name": f"Produkt {barcode}",
        "image": None,
        "found": False
    }
