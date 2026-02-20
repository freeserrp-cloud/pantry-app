from typing import Iterable, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.shopping_list_item import ShoppingListItem


class ShoppingListRepository:
    def list_items(self, db: Session, household_id: str) -> Iterable[ShoppingListItem]:
        stmt = (
            select(ShoppingListItem)
            .where(ShoppingListItem.household_id == household_id)
            .order_by(ShoppingListItem.completed.asc(), ShoppingListItem.created_at.desc())
        )
        return db.execute(stmt).scalars().all()

    def get_item(self, db: Session, item_id: str, household_id: str) -> Optional[ShoppingListItem]:
        stmt = select(ShoppingListItem).where(
            ShoppingListItem.id == item_id,
            ShoppingListItem.household_id == household_id,
        )
        return db.execute(stmt).scalars().first()

    def get_item_by_name(self, db: Session, name: str, household_id: str) -> Optional[ShoppingListItem]:
        stmt = select(ShoppingListItem).where(
            func.lower(ShoppingListItem.name) == name.lower(),
            ShoppingListItem.household_id == household_id,
            ShoppingListItem.completed.is_(False),
        )
        return db.execute(stmt).scalars().first()

    def create_item(self, db: Session, item: ShoppingListItem) -> ShoppingListItem:
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def update_item(self, db: Session, item: ShoppingListItem) -> ShoppingListItem:
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def delete_item(self, db: Session, item: ShoppingListItem) -> None:
        db.delete(item)
        db.commit()
