import re
from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.shopping_list_item import ShoppingListItem
from app.repositories.shopping_list_repository import ShoppingListRepository
from app.schemas.shopping_list_item import AlexaImportResult, ShoppingListItemCreate, ShoppingListItemRead, ShoppingListItemUpdate


class ShoppingListService:
    def __init__(self, repository: ShoppingListRepository | None = None) -> None:
        self.repository = repository or ShoppingListRepository()
        self.settings = get_settings()

    def list_items(self, db: Session) -> Iterable[ShoppingListItem]:
        return self.repository.list_items(db, self.settings.household_id)

    def create_item(self, db: Session, payload: ShoppingListItemCreate) -> ShoppingListItem:
        normalized_name = self._normalize_name(payload.name)
        existing = self.repository.get_item_by_name(db, normalized_name, self.settings.household_id)
        if existing:
            existing.quantity += payload.quantity
            return self.repository.update_item(db, existing)

        item = ShoppingListItem(
            household_id=self.settings.household_id,
            name=normalized_name,
            quantity=payload.quantity,
            completed=False,
        )
        return self.repository.create_item(db, item)

    def update_item(self, db: Session, item_id: str, payload: ShoppingListItemUpdate) -> ShoppingListItem:
        item = self._get_or_404(db, item_id)
        data = payload.model_dump(exclude_unset=True)
        if "name" in data and data["name"] is not None:
            data["name"] = self._normalize_name(data["name"])
        for key, value in data.items():
            setattr(item, key, value)
        return self.repository.update_item(db, item)

    def delete_item(self, db: Session, item_id: str) -> None:
        item = self._get_or_404(db, item_id)
        self.repository.delete_item(db, item)

    def import_from_alexa(self, db: Session, utterance: str) -> AlexaImportResult:
        parsed = self._parse_alexa_utterance(utterance)
        created_items: list[ShoppingListItemRead] = []
        for name, quantity in parsed:
            item = self.create_item(db, ShoppingListItemCreate(name=name, quantity=quantity))
            created_items.append(ShoppingListItemRead.model_validate(item))

        return AlexaImportResult(
            created_items=created_items,
            parsed_names=[name for name, _ in parsed],
        )

    def _get_or_404(self, db: Session, item_id: str) -> ShoppingListItem:
        item = self.repository.get_item(db, item_id, self.settings.household_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping list item not found.")
        return item

    def _normalize_name(self, name: str) -> str:
        return " ".join(name.split()).strip()

    def _parse_alexa_utterance(self, utterance: str) -> list[tuple[str, int]]:
        cleaned = utterance.strip().lower()
        if not cleaned:
            return []

        normalized = re.sub(r"\b(und|sowie|plus|mit)\b", ",", cleaned)
        normalized = normalized.replace(";", ",")
        parts = [part.strip() for part in normalized.split(",") if part.strip()]

        parsed: list[tuple[str, int]] = []
        quantity_pattern = re.compile(r"^(\d+)\s*(x|mal|stk|stück|packung|packungen)?\s+(.+)$", re.IGNORECASE)
        drop_prefix_pattern = re.compile(r"^(bitte|füge|setz|setze|auf|meine|meiner|liste|einkaufsliste)\s+", re.IGNORECASE)

        for part in parts:
            candidate = part
            while True:
                updated = drop_prefix_pattern.sub("", candidate).strip()
                if updated == candidate:
                    break
                candidate = updated

            quantity = 1
            match = quantity_pattern.match(candidate)
            if match:
                quantity = max(1, int(match.group(1)))
                candidate = match.group(3).strip()

            candidate = candidate.strip(" .")
            if not candidate:
                continue

            parsed.append((self._normalize_name(candidate), quantity))

        return parsed
