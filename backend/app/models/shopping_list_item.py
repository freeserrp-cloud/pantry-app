import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.models.inventory_item import Base


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    household_id = Column(String(36), index=True, nullable=False)
    name = Column(String(200), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
