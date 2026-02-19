import requests

OFF = "https://world.openfoodfacts.org/api/v0/product/"

def lookup_product(barcode: str):
    try:
        r = requests.get(f"{OFF}{barcode}.json", timeout=5)
        data = r.json()

        if data.get("status") == 1:
            product = data.get("product", {})
            return {
                "name": product.get("product_name"),
                "image": product.get("image_front_url"),
                "brand": product.get("brands"),
                "found": True,
            }
    except Exception as e:
        print("Lookup error:", e)

    return {
        "name": f"Produkt {barcode}",
        "image": None,
        "brand": None,
        "found": False,
    }
