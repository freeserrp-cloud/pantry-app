from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.shopping_list_item import AlexaImportRequest, AlexaImportResult, ShoppingListItemCreate, ShoppingListItemRead, ShoppingListItemUpdate
from app.services.shopping_list_service import ShoppingListService


router = APIRouter(prefix="/shopping-list", tags=["shopping-list"])
service = ShoppingListService()


@router.get("", response_model=list[ShoppingListItemRead])
def list_items(db: Session = Depends(get_db)):
    return service.list_items(db)


@router.post("", response_model=ShoppingListItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: ShoppingListItemCreate, db: Session = Depends(get_db)):
    return service.create_item(db, payload)


@router.put("/{item_id}", response_model=ShoppingListItemRead)
def update_item(item_id: str, payload: ShoppingListItemUpdate, db: Session = Depends(get_db)):
    return service.update_item(db, item_id, payload)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: str, db: Session = Depends(get_db)):
    service.delete_item(db, item_id)
    return None


@router.post("/alexa-import", response_model=AlexaImportResult)
def alexa_import(payload: AlexaImportRequest, db: Session = Depends(get_db)):
    return service.import_from_alexa(db, payload.utterance)
