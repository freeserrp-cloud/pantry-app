import { Injectable, computed, signal } from "@angular/core";
import { finalize } from "rxjs";

import { InventoryApi } from "./inventory.api";
import { InventoryItem, InventoryItemCreate, InventoryItemUpdate } from "./inventory.models";

@Injectable({ providedIn: "root" })
export class InventoryStore {
  private _items = signal<InventoryItem[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  items = this._items.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  lowStock = computed(() => this._items().filter((item) => item.quantity <= item.min_quantity));

  constructor(private api: InventoryApi) {}

  loadItems() {
    this._loading.set(true);
    this.api
      .list()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (items) => {
          this._items.set(items);
          this._error.set(null);
        },
        error: () => this._error.set("Could not load items.")
      });
  }

  createItem(payload: InventoryItemCreate) {
    this._loading.set(true);
    this.api
      .create(payload)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (item) => {
          this._items.set([item, ...this._items()]);
          this._error.set(null);
        },
        error: () => this._error.set("Could not create item.")
      });
  }

  updateItem(id: string, payload: InventoryItemUpdate) {
    this._loading.set(true);
    this.api
      .update(id, payload)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (item) => {
          const updated = this._items().map((existing) => (existing.id === id ? item : existing));
          this._items.set(updated);
          this._error.set(null);
        },
        error: () => this._error.set("Could not update item.")
      });
  }

  deleteItem(id: string) {
    this._loading.set(true);
    this.api
      .delete(id)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this._items.set(this._items().filter((item) => item.id !== id));
          this._error.set(null);
        },
        error: () => this._error.set("Could not delete item.")
      });
  }

  increment(id: string) {
    this.api.increment(id).subscribe({
      next: (item) => this._replace(item),
      error: () => this._error.set("Could not update quantity.")
    });
  }

  decrement(id: string) {
    this.api.decrement(id).subscribe({
      next: (item) => this._replace(item),
      error: () => this._error.set("Could not update quantity.")
    });
  }

  getById(id: string) {
    return this._items().find((item) => item.id === id) ?? null;
  }

  private _replace(item: InventoryItem) {
    this._items.set(this._items().map((existing) => (existing.id === item.id ? item : existing)));
    this._error.set(null);
  }
}
