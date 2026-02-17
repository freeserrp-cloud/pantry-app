from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.inventory_item import InventoryItem
from app.repositories.inventory_repository import InventoryRepository
from app.schemas.inventory_item import InventoryItemCreate, InventoryItemUpdate


class InventoryService:
    def __init__(self, repository: InventoryRepository | None = None) -> None:
        self.repository = repository or InventoryRepository()
        self.settings = get_settings()

    def list_items(self, db: Session) -> Iterable[InventoryItem]:
        return self.repository.list_items(db, self.settings.household_id)

    def create_item(self, db: Session, payload: InventoryItemCreate) -> InventoryItem:
        item = InventoryItem(
            household_id=self.settings.household_id,
            name=payload.name,
            quantity=payload.quantity,
            min_quantity=payload.min_quantity,
            category=payload.category,
        )
        return self.repository.create_item(db, item)

    def update_item(self, db: Session, item_id: str, payload: InventoryItemUpdate) -> InventoryItem:
        item = self._get_or_404(db, item_id)
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(item, key, value)
        return self.repository.update_item(db, item)

    def delete_item(self, db: Session, item_id: str) -> None:
        item = self._get_or_404(db, item_id)
        self.repository.delete_item(db, item)

    def adjust_quantity(self, db: Session, item_id: str, delta: int) -> InventoryItem:
        item = self._get_or_404(db, item_id)
        new_value = item.quantity + delta
        if new_value < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity cannot be negative.",
            )
        item.quantity = new_value
        return self.repository.update_item(db, item)

    def _get_or_404(self, db: Session, item_id: str) -> InventoryItem:
        item = self.repository.get_item(db, item_id, self.settings.household_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")
        return item
