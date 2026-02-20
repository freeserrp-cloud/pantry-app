from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ShoppingListItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    quantity: int = Field(1, ge=1)


class ShoppingListItemCreate(ShoppingListItemBase):
    pass


class ShoppingListItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    quantity: Optional[int] = Field(None, ge=1)
    completed: Optional[bool] = None


class ShoppingListItemRead(ShoppingListItemBase):
    id: str
    household_id: str
    completed: bool
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class AlexaImportRequest(BaseModel):
    utterance: str = Field(..., min_length=1, max_length=2000)


class AlexaImportResult(BaseModel):
    created_items: list[ShoppingListItemRead]
    parsed_names: list[str]
