import { Component, OnInit, inject, signal } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { RouterLink } from "@angular/router";

import { InventoryStore } from "./inventory.store";
import { BarcodeScannerComponent } from "../shared/barcode-scanner.component";
import { environment } from "../../environments/environment";

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
  private readonly maxNameLength = 200;
  private readonly cacheStorageKey = "barcode-name-cache-v1";
  private barcodeNameCache = new Map<string, string>();
  showScanner = signal(false);
  scannerError = signal<string | null>(null);

  constructor() {
    this.barcodeNameCache = this.loadBarcodeNameCache();
  }

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
    void this.handleDetected(barcode);
  }

  onScannerError(message: string) {
    this.scannerError.set(message);
  }

  private async handleDetected(barcode: string) {
    const normalizedBarcode = this.normalizeBarcodeForPersist(barcode);
    const existingByBarcode = this.findExistingItemByBarcode(normalizedBarcode);
    if (existingByBarcode) {
      this.store.increment(existingByBarcode.id);
      return;
    }

    const candidates = this.getBarcodeCandidates(normalizedBarcode);
    const cachedName = this.getCachedName(candidates);
    const initialName = this.normalizeName(cachedName ?? `Produkt ${normalizedBarcode}`, normalizedBarcode);

    this.addItem({
      barcode: normalizedBarcode,
      name: initialName
    });

    if (cachedName) {
      return;
    }

    void this.resolveNameInBackground(normalizedBarcode);
  }

  private async lookupProductName(barcode: string) {
    const candidates = this.getBarcodeCandidates(barcode);
    const cachedName = this.getCachedName(candidates);
    if (cachedName) {
      return cachedName;
    }

    for (const candidate of candidates) {
      try {
        const backendResponse = await fetch(`${environment.apiUrl}/products/lookup/${candidate}`);
        const backendName = await this.extractNameFromLookupResponse(backendResponse, candidate);
        if (backendName) {
          this.cacheNameForCandidates(candidates, backendName);
          return backendName;
        }
      } catch (e) {
        console.warn("backend lookup failed", e);
      }
    }

    for (const candidate of candidates) {
      try {
        const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${candidate}.json`);
        const offName = await this.extractNameFromLookupResponse(offResponse, candidate);
        if (offName) {
          this.cacheNameForCandidates(candidates, offName);
          return offName;
        }
      } catch (e) {
        console.warn("openfoodfacts lookup failed", e);
      }
    }

    return `Produkt ${barcode}`;
  }

  private async addItem(payload: { barcode: string; name: string }) {
    const existingByBarcode = this.findExistingItemByBarcode(payload.barcode);
    if (existingByBarcode) {
      this.store.increment(existingByBarcode.id);
      return;
    }

    const existing = this.findExistingItemByName(payload.name);
    if (existing) {
      this.store.increment(existing.id);
      return;
    }

    this.store.createItem({
      name: payload.name,
      barcode: this.normalizeBarcodeForPersist(payload.barcode),
      quantity: 1,
      min_quantity: 0,
      category: null
    });
  }

  private normalizeName(name: string, barcode: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      return `Produkt ${barcode}`;
    }
    if (trimmed.length <= this.maxNameLength) {
      return trimmed;
    }
    return trimmed.slice(0, this.maxNameLength);
  }

  private async extractNameFromLookupResponse(response: Response, barcode: string) {
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as
      | {
          found?: boolean;
          name?: string;
          product_name?: string;
          product?: {
            product_name?: string;
            product_name_de?: string;
            product_name_en?: string;
            generic_name?: string;
          };
        }
      | null;

    if (data?.found === false) {
      return null;
    }

    const candidate = data?.name
      ?? data?.product_name
      ?? data?.product?.product_name_de
      ?? data?.product?.product_name_en
      ?? data?.product?.product_name
      ?? data?.product?.generic_name;
    const name = candidate?.trim();
    if (!name) {
      return null;
    }
    if (this.isPlaceholderName(name, barcode)) {
      return null;
    }
    return name;
  }

  private isPlaceholderName(name: string, barcode: string) {
    const normalized = name.trim().toLowerCase();
    const normalizedBarcode = barcode.trim().toLowerCase();
    return (
      normalized === `produkt ${normalizedBarcode}`
      || normalized === `product ${normalizedBarcode}`
      || normalized === normalizedBarcode
    );
  }

  private getBarcodeCandidates(rawBarcode: string) {
    const raw = rawBarcode.trim();
    const digitsOnly = this.normalizeBarcodeForPersist(raw);
    const candidates: string[] = [];

    this.pushCandidate(candidates, raw);
    this.pushCandidate(candidates, digitsOnly);

    if (digitsOnly.length === 12) {
      this.pushCandidate(candidates, `0${digitsOnly}`);
    }
    if (digitsOnly.length === 13 && digitsOnly.startsWith("0")) {
      this.pushCandidate(candidates, digitsOnly.slice(1));
    }

    return candidates;
  }

  private pushCandidate(candidates: string[], value: string) {
    if (!value || candidates.includes(value)) {
      return;
    }
    candidates.push(value);
  }

  private findExistingItemByName(name: string) {
    const normalized = this.normalizeProductKey(name);
    if (!normalized) {
      return null;
    }
    return this.store.items().find((item) => this.normalizeProductKey(item.name) === normalized) ?? null;
  }

  private findExistingItemByBarcode(barcode: string) {
    const normalizedBarcode = this.normalizeBarcodeForPersist(barcode);
    if (!normalizedBarcode) {
      return null;
    }
    return (
      this.store.items().find((item) => {
        if (!item.barcode) {
          return false;
        }
        return this.normalizeBarcodeForPersist(item.barcode) === normalizedBarcode;
      }) ?? null
    );
  }

  private normalizeProductKey(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  private normalizeBarcodeForPersist(value: string) {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      return value.trim();
    }

    const gtinFromGs1 = this.extractGtinFromGs1(digitsOnly);
    let normalized = gtinFromGs1 ?? digitsOnly;
    if (normalized.length === 14 && normalized.startsWith("0")) {
      normalized = normalized.slice(1);
    }
    if (normalized.length === 13 && normalized.startsWith("0")) {
      normalized = normalized.slice(1);
    }
    return normalized;
  }

  private async resolveNameInBackground(barcode: string) {
    const lookedUpName = await this.lookupProductName(barcode);
    const normalizedName = this.normalizeName(lookedUpName, barcode);
    if (this.isPlaceholderName(normalizedName, barcode)) {
      return;
    }

    const candidates = this.getBarcodeCandidates(barcode);
    this.cacheNameForCandidates(candidates, normalizedName);

    const target = await this.waitForItemByBarcode(barcode);
    if (!target) {
      return;
    }
    if (this.normalizeProductKey(target.name) === this.normalizeProductKey(normalizedName)) {
      return;
    }

    this.store.updateItem(target.id, { name: normalizedName });
  }

  private async waitForItemByBarcode(barcode: string, timeoutMs = 2500) {
    const start = Date.now();
    while (Date.now() - start <= timeoutMs) {
      const item = this.findExistingItemByBarcode(barcode);
      if (item) {
        return item;
      }
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    return null;
  }

  private extractGtinFromGs1(digits: string) {
    const marker = "01";
    const markerIndex = digits.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }
    const start = markerIndex + marker.length;
    const end = start + 14;
    if (digits.length < end) {
      return null;
    }
    return digits.slice(start, end);
  }

  private getCachedName(candidates: string[]) {
    for (const candidate of candidates) {
      const name = this.barcodeNameCache.get(candidate);
      if (name && name.trim().length > 0) {
        return name;
      }
    }
    return null;
  }

  private cacheNameForCandidates(candidates: string[], name: string) {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return;
    }
    for (const candidate of candidates) {
      this.barcodeNameCache.set(candidate, normalizedName);
    }
    this.persistBarcodeNameCache();
  }

  private loadBarcodeNameCache() {
    try {
      const raw = localStorage.getItem(this.cacheStorageKey);
      if (!raw) {
        return new Map<string, string>();
      }
      const parsed = JSON.parse(raw) as Record<string, string>;
      return new Map(Object.entries(parsed));
    } catch {
      return new Map<string, string>();
    }
  }

  private persistBarcodeNameCache() {
    try {
      const data = Object.fromEntries(this.barcodeNameCache.entries());
      localStorage.setItem(this.cacheStorageKey, JSON.stringify(data));
    } catch {
      // Ignore storage errors; lookup still works without cache persistence.
    }
  }
}
