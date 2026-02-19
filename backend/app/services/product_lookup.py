import requests

API = "https://world.openfoodfacts.org/api/v0/product/"
cache: dict[str, dict] = {}


def fetch_product_from_openfoodfacts(barcode: str):
    if barcode in cache:
        return cache[barcode]

    url = f"{API}{barcode}.json"

    try:
        res = requests.get(url, timeout=3)
        data = res.json()

        if data.get("status") == 1:
            product = data["product"]
            result = {
                "name": product.get("product_name") or f"Produkt {barcode}",
                "image": product.get("image_front_url"),
                "brand": product.get("brands"),
                "found": True
            }
            cache[barcode] = result
            return result
    except Exception:
        pass

    result = {
        "name": f"Produkt {barcode}",
        "image": None,
        "brand": None,
        "found": False
    }
    cache[barcode] = result
    return result
