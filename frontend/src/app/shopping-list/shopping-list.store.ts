import { Injectable, computed, signal } from "@angular/core";
import { finalize } from "rxjs";

import { ShoppingListApi } from "./shopping-list.api";
import { AlexaImportResult, ShoppingListItem, ShoppingListItemCreate } from "./shopping-list.models";

@Injectable({ providedIn: "root" })
export class ShoppingListStore {
  private _items = signal<ShoppingListItem[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _lastAlexaImport = signal<AlexaImportResult | null>(null);

  items = this._items.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  lastAlexaImport = this._lastAlexaImport.asReadonly();

  openItems = computed(() => this._items().filter((item) => !item.completed));
  completedItems = computed(() => this._items().filter((item) => item.completed));

  constructor(private api: ShoppingListApi) {}

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
        error: () => this._error.set("Could not load shopping list.")
      });
  }

  createItem(payload: ShoppingListItemCreate) {
    this._loading.set(true);
    this.api
      .create(payload)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (item) => {
          const current = this._items().filter((existing) => existing.id !== item.id);
          this._items.set([item, ...current]);
          this._error.set(null);
        },
        error: () => this._error.set("Could not add shopping item.")
      });
  }

  updateItem(id: string, payload: { name?: string; quantity?: number; completed?: boolean }) {
    this.api.update(id, payload).subscribe({
      next: (item) => {
        const updated = this._items().map((existing) => (existing.id === id ? item : existing));
        this._items.set(updated);
        this._error.set(null);
      },
      error: () => this._error.set("Could not update shopping item.")
    });
  }

  deleteItem(id: string) {
    this.api.delete(id).subscribe({
      next: () => {
        this._items.set(this._items().filter((item) => item.id !== id));
        this._error.set(null);
      },
      error: () => this._error.set("Could not delete shopping item.")
    });
  }

  importAlexa(utterance: string) {
    this._loading.set(true);
    this.api
      .importAlexa(utterance)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (result) => {
          this._lastAlexaImport.set(result);
          this.loadItems();
        },
        error: () => this._error.set("Could not import Alexa command.")
      });
  }
}
