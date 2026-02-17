from typing import Iterable, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inventory_item import InventoryItem


class InventoryRepository:
    def list_items(self, db: Session, household_id: str) -> Iterable[InventoryItem]:
        stmt = select(InventoryItem).where(InventoryItem.household_id == household_id).order_by(InventoryItem.created_at.desc())
        return db.execute(stmt).scalars().all()

    def get_item(self, db: Session, item_id: str, household_id: str) -> Optional[InventoryItem]:
        stmt = select(InventoryItem).where(
            InventoryItem.id == item_id,
            InventoryItem.household_id == household_id,
        )
        return db.execute(stmt).scalars().first()

    def create_item(self, db: Session, item: InventoryItem) -> InventoryItem:
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def update_item(self, db: Session, item: InventoryItem) -> InventoryItem:
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def delete_item(self, db: Session, item: InventoryItem) -> None:
        db.delete(item)
        db.commit()
