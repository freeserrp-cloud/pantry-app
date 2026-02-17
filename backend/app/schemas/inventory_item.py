from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class InventoryItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    quantity: int = Field(0, ge=0)
    min_quantity: int = Field(0, ge=0)
    category: Optional[str] = Field(None, max_length=120)


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    quantity: Optional[int] = Field(None, ge=0)
    min_quantity: Optional[int] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=120)


class InventoryItemRead(InventoryItemBase):
    id: str
    household_id: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
