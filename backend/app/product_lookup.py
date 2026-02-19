import requests

def lookup_product(barcode: str):
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        res = requests.get(url, timeout=5)

        if res.status_code != 200:
            raise Exception("OpenFoodFacts error")

        data = res.json()
        product = data.get("product", {})

        name = (
            product.get("product_name_de")
            or product.get("product_name_en")
            or product.get("product_name")
            or product.get("generic_name")
        )

        image = product.get("image_front_url") or product.get("image_url")
        brand = product.get("brands")

        if not name:
            raise Exception("No name")

        return {
            "name": name,
            "image": image,
            "brand": brand,
            "found": True
        }

    except Exception:
        return {
            "name": f"Produkt {barcode}",
            "image": None,
            "brand": None,
            "found": False
        }
