from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.core.config import get_settings
from app.core.database import engine
from app.models.inventory_item import Base
from app.routers.health import router as health_router
from app.routers.inventory import router as inventory_router
from app.routers.products import router as products_router


settings = get_settings()


app = FastAPI(title="Pantry API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(inventory_router)
app.include_router(products_router, prefix="/products", tags=["products"])


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_inventory_barcode_column()


def ensure_inventory_barcode_column() -> None:
    inspector = inspect(engine)
    if "inventory_items" not in inspector.get_table_names():
        return

    column_names = {column["name"] for column in inspector.get_columns("inventory_items")}
    if "barcode" in column_names:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE inventory_items ADD COLUMN barcode VARCHAR(64)"))
