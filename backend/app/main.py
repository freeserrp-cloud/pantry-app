from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import engine
from app.models.inventory_item import Base
from app.routers.health import router as health_router
from app.routers.inventory import router as inventory_router


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


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
