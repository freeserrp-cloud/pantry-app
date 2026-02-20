from app.routers.health import router as health
from app.routers.inventory import router as inventory
from app.routers.products import router as products
from app.routers.shopping_list import router as shopping_list

__all__ = ["health", "inventory", "products", "shopping_list"]
