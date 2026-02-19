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
        normalized_barcode = self._normalize_barcode(payload.barcode)
        if normalized_barcode:
            existing = self.repository.get_item_by_barcode(db, normalized_barcode, self.settings.household_id)
            if existing:
                if not existing.barcode:
                    existing.barcode = normalized_barcode
                existing.quantity += payload.quantity
                return self.repository.update_item(db, existing)

        normalized_name = self._normalize_name(payload.name)
        if normalized_name:
            existing_by_name = self.repository.get_item_by_name(db, normalized_name, self.settings.household_id)
            if existing_by_name:
                if normalized_barcode and not existing_by_name.barcode:
                    existing_by_name.barcode = normalized_barcode
                existing_by_name.quantity += payload.quantity
                return self.repository.update_item(db, existing_by_name)

        item = InventoryItem(
            household_id=self.settings.household_id,
            name=payload.name,
            barcode=normalized_barcode,
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

    def _normalize_barcode(self, barcode: str | None) -> str | None:
        if not barcode:
            return None
        cleaned = "".join(ch for ch in barcode if ch.isdigit())
        if not cleaned:
            return None
        gtin_from_gs1 = self._extract_gtin_from_gs1(cleaned)
        if gtin_from_gs1:
            cleaned = gtin_from_gs1

        # Normalize UPC/EAN variants so the same product maps to one key.
        if len(cleaned) == 14 and cleaned.startswith("0"):
            cleaned = cleaned[1:]
        if len(cleaned) == 13 and cleaned.startswith("0"):
            return cleaned[1:]
        if len(cleaned) == 12:
            return cleaned
        return cleaned

    def _extract_gtin_from_gs1(self, digits: str) -> str | None:
        marker = "01"
        marker_index = digits.find(marker)
        if marker_index == -1:
            return None
        start = marker_index + len(marker)
        end = start + 14
        if len(digits) < end:
            return None
        return digits[start:end]

    def _normalize_name(self, name: str | None) -> str | None:
        if not name:
            return None
        normalized = " ".join(name.split()).strip()
        return normalized or None
