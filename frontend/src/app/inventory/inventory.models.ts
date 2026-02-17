export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  category?: string | null;
  created_at: string;
  household_id: string;
}

export interface InventoryItemCreate {
  name: string;
  quantity: number;
  min_quantity: number;
  category?: string | null;
}

export interface InventoryItemUpdate {
  name?: string;
  quantity?: number;
  min_quantity?: number;
  category?: string | null;
}
