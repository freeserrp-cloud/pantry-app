import { Component, OnInit, inject, signal } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { InventoryStore } from "./inventory.store";
import { BarcodeScannerComponent } from "../shared/barcode-scanner.component";

const API = "https://pantry-app-fm9y.onrender.com";

@Component({
  selector: "app-inventory-list",
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, BarcodeScannerComponent],
  template: `
    <section class="inventory-header">
      <div>
        <h1>Inventory</h1>
        <p class="hint">Tap + / - to update quickly.</p>
      </div>
      <div class="actions">
        <button class="secondary" (click)="openScanner()">Scan Product</button>
        <a class="primary" routerLink="/items/new">Add Item</a>
      </div>
    </section>

    <section *ngIf="store.error()" class="error">{{ store.error() }}</section>

    <section *ngIf="store.loading()" class="loading">Loading...</section>

    <section *ngIf="!store.loading() && store.items().length === 0" class="empty">
      <div class="empty-card">
        <h2>No items yet</h2>
        <p>Add your first pantry item to get started.</p>
        <a class="primary" routerLink="/items/new">Add Item</a>
      </div>
    </section>

    <section class="inventory-list" *ngIf="store.items().length">
      <article
        class="item-card"
        *ngFor="let item of store.items(); trackBy: trackById"
        [class.low]="isLow(item.quantity, item.min_quantity)"
      >
        <div class="item-main">
          <div>
            <div class="item-name">{{ item.name }}</div>
            <div class="item-meta">
              <span *ngIf="item.category">{{ item.category }}</span>
              <span *ngIf="item.min_quantity > 0">Min {{ item.min_quantity }}</span>
            </div>
          </div>
          <div class="quantity" [attr.aria-label]="'Quantity ' + item.quantity">
            {{ item.quantity }}
          </div>
        </div>
        <div class="item-actions">
          <button class="qty-btn" (click)="store.decrement(item.id)" aria-label="Decrease quantity">-</button>
          <button class="qty-btn" (click)="store.increment(item.id)" aria-label="Increase quantity">+</button>
        </div>
        <div class="item-links">
          <a routerLink="/items/{{ item.id }}">Edit</a>
          <button class="ghost" (click)="store.deleteItem(item.id)">Delete</button>
        </div>
      </article>
    </section>

    <div class="scanner-overlay" *ngIf="showScanner()">
      <div class="scanner-modal">
        <app-barcode-scanner
          (detected)="onDetected($event)"
          (error)="onScannerError($event)"
        />
        <div class="scanner-error-banner" *ngIf="scannerError()">
          {{ scannerError() }}
        </div>
        <button class="scanner-cancel" (click)="closeScanner()">Cancel</button>
      </div>
    </div>
  `,
  styleUrls: ["./inventory-list.page.css"]
})
export class InventoryListPage implements OnInit {
  store = inject(InventoryStore);
  private http = inject(HttpClient);
  showScanner = signal(false);
  scannerError = signal<string | null>(null);

  ngOnInit() {
    this.store.loadItems();
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }

  isLow(quantity: number, min: number) {
    return quantity <= min;
  }

  openScanner() {
    this.scannerError.set(null);
    this.showScanner.set(true);
  }

  closeScanner() {
    this.showScanner.set(false);
  }

  onDetected(barcode: string) {
    this.showScanner.set(false);
    void this.addItem(barcode);
  }

  onScannerError(message: string) {
    this.scannerError.set(message);
  }

  private async addItem(barcode: string) {
    const fallbackName = `Produkt ${barcode}`;
    const item = {
      name: fallbackName,
      quantity: 1
    };

    try {
      const saved = (await firstValueFrom(
        this.http.post<{ id?: string }>(`${API}/items`, item)
      )) as { id?: string };
      this.store.loadItems();

      if (saved.id) {
        void this.lookupProductName(barcode, saved.id);
      }
    } catch (e) {
      console.error("Save failed", e);
    }
  }

  private async lookupProductName(barcode: string, itemId: string) {
    try {
      const res = await fetch(`${API}/products/lookup/${encodeURIComponent(barcode)}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (data?.found && typeof data?.name === "string" && data.name.trim()) {
        await this.updateItemName(itemId, data.name.trim());
      }
    } catch {
      // Ignore lookup failures.
    }
  }

  private async updateItemName(itemId: string, name: string) {
    const response = await fetch(`${API}/items/${encodeURIComponent(itemId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (response.ok) {
      this.store.loadItems();
    }
  }
}
