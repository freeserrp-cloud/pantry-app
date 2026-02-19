import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), index=True, nullable=False)
    name = Column(String(200), nullable=False, index=True)
    barcode = Column(String(64), nullable=True, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    min_quantity = Column(Integer, nullable=False, default=0)
    category = Column(String(120), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
