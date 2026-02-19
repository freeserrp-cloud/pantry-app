from app.main import app
import requests

__all__ = ["app"]


@app.get("/debug/off")
def debug_openfoodfacts():
    try:
        r = requests.get(
            "https://world.openfoodfacts.org/api/v0/product/5449000000996.json",
            timeout=5,
        )
        return {
            "status_code": r.status_code,
            "ok": r.ok,
            "json": r.json().get("product", {}).get("product_name")
        }
    except Exception as e:
        return {"error": str(e)}
