import { Routes } from "@angular/router";

import { InventoryListPage } from "./inventory/inventory-list.page";
import { InventoryFormPage } from "./inventory/inventory-form.page";
import { ShoppingListPage } from "./shopping-list/shopping-list.page";

export const appRoutes: Routes = [
  { path: "", component: InventoryListPage },
  { path: "shopping-list", component: ShoppingListPage },
  { path: "items/new", component: InventoryFormPage },
  { path: "items/:id", component: InventoryFormPage },
  { path: "**", redirectTo: "" }
];
