import requests

OFF_GLOBAL = "https://world.openfoodfacts.org/api/v0/product/"
OFF_DE = "https://de.openfoodfacts.org/api/v0/product/"
UPC = "https://api.upcitemdb.com/prod/trial/lookup?upc="


def _extract_off(data):
    if data.get("status") == 1:
        p = data.get("product", {})
        name = p.get("product_name") or p.get("generic_name")
        image = p.get("image_front_url")
        brand = p.get("brands")
        if name:
            return name, image, brand
    return None


def lookup_product(barcode: str):
    # 1️⃣ OpenFoodFacts global
    try:
        r = requests.get(f"{OFF_GLOBAL}{barcode}.json", timeout=5)
        result = _extract_off(r.json())
        if result:
            name, image, brand = result
            return {"name": name, "image": image, "brand": brand, "found": True}
    except:
        pass

    # 2️⃣ OpenFoodFacts Germany
    try:
        r = requests.get(f"{OFF_DE}{barcode}.json", timeout=5)
        result = _extract_off(r.json())
        if result:
            name, image, brand = result
            return {"name": name, "image": image, "brand": brand, "found": True}
    except:
        pass

    # 3️⃣ UPC fallback
    try:
        r = requests.get(f"{UPC}{barcode}", timeout=5)
        data = r.json()
        items = data.get("items")
        if items:
            item = items[0]
            return {
                "name": item.get("title"),
                "image": (item.get("images") or [None])[0],
                "brand": item.get("brand"),
                "found": True
            }
    except:
        pass

    # 4️⃣ Smart fallback (cleaner than "Produkt 123")
    return {
        "name": f"Unbekanntes Produkt ({barcode})",
        "image": None,
        "brand": None,
        "found": False
    }
