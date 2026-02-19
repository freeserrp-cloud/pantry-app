from app.routers.health import router as health
from app.routers.inventory import router as inventory
from app.routers.products import router as products

__all__ = ["health", "inventory", "products"]
