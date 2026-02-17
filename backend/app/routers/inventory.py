from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.inventory_item import InventoryItemCreate, InventoryItemRead, InventoryItemUpdate
from app.services.inventory_service import InventoryService


router = APIRouter(prefix="/items", tags=["inventory"])
service = InventoryService()


@router.get("", response_model=list[InventoryItemRead])
def list_items(db: Session = Depends(get_db)):
    return service.list_items(db)


@router.post("", response_model=InventoryItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    return service.create_item(db, payload)


@router.put("/{item_id}", response_model=InventoryItemRead)
def update_item(item_id: str, payload: InventoryItemUpdate, db: Session = Depends(get_db)):
    return service.update_item(db, item_id, payload)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: str, db: Session = Depends(get_db)):
    service.delete_item(db, item_id)
    return None


@router.post("/{item_id}/increment", response_model=InventoryItemRead)
def increment_item(item_id: str, db: Session = Depends(get_db)):
    return service.adjust_quantity(db, item_id, 1)


@router.post("/{item_id}/decrement", response_model=InventoryItemRead)
def decrement_item(item_id: str, db: Session = Depends(get_db)):
    return service.adjust_quantity(db, item_id, -1)
