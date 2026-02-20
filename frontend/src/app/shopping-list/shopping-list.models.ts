export interface ShoppingListItem {
  id: string;
  household_id: string;
  name: string;
  quantity: number;
  completed: boolean;
  created_at: string;
}

export interface ShoppingListItemCreate {
  name: string;
  quantity: number;
}

export interface ShoppingListItemUpdate {
  name?: string;
  quantity?: number;
  completed?: boolean;
}

export interface AlexaImportResult {
  created_items: ShoppingListItem[];
  parsed_names: string[];
}
