import { Component, OnInit, computed, inject } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { InventoryStore } from "../inventory/inventory.store";
import { ShoppingListStore } from "./shopping-list.store";
import { ShoppingListItem } from "./shopping-list.models";

@Component({
  selector: "app-shopping-list",
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  template: `
    <div class="shopping-page">
      <section class="card">
        <h2>Einkaufsliste</h2>
        <p>Manuell hinzufügen oder Alexa-Sprachtext importieren.</p>

        <form class="add-form" (ngSubmit)="addManualItem()">
          <input
            type="text"
            name="itemName"
            placeholder="z. B. Milch"
            [(ngModel)]="manualName"
            required
          />
          <input
            type="number"
            name="itemQty"
            min="1"
            [(ngModel)]="manualQuantity"
            required
          />
          <button type="submit">Hinzufügen</button>
        </form>
      </section>

      <section class="card">
        <h3>Alexa-Import</h3>
        <p class="hint">Beispiel: "2x Milch und Eier, Brot"</p>
        <textarea
          rows="3"
          placeholder="Alexa-Sprachbefehl hier einfügen"
          [(ngModel)]="alexaUtterance"
          name="alexaUtterance"
        ></textarea>
        <button class="full" (click)="importAlexa()" [disabled]="!alexaUtterance.trim()">Aus Sprache übernehmen</button>
        <p *ngIf="store.lastAlexaImport()" class="hint">
          Erkannt: {{ store.lastAlexaImport()?.parsed_names?.join(", ") }}
        </p>
      </section>

      <section *ngIf="store.error()" class="error">{{ store.error() }}</section>
      <section *ngIf="store.loading()" class="loading">Lade…</section>

      <section class="card" *ngIf="store.openItems().length; else emptyState">
        <h3>Offen</h3>
        <article class="list-item" *ngFor="let item of store.openItems(); trackBy: trackById">
          <div>
            <div class="name-row" *ngIf="editingId !== item.id; else editRow">
              <strong>{{ item.name }}</strong>
              <span class="qty">x{{ item.quantity }}</span>
            </div>
            <div class="inv-flag" [class.available]="isInInventory(item.name)">
              {{ inventoryStatus(item.name) }}
            </div>
          </div>
          <div class="actions">
            <button type="button" (click)="changeQty(item.id, item.quantity - 1)" [disabled]="item.quantity <= 1">-</button>
            <button type="button" (click)="changeQty(item.id, item.quantity + 1)">+</button>
            <button type="button" (click)="markDone(item.id)">Erledigt</button>
            <button type="button" (click)="startEdit(item)">Bearbeiten</button>
            <button type="button" class="ghost" (click)="deleteItem(item.id)">Löschen</button>
          </div>

          <ng-template #editRow>
            <div class="edit-row">
              <input type="text" [(ngModel)]="editName" [ngModelOptions]="{ standalone: true }" />
              <input type="number" min="1" [(ngModel)]="editQuantity" [ngModelOptions]="{ standalone: true }" />
              <button type="button" (click)="saveEdit(item.id)">Speichern</button>
              <button type="button" class="ghost" (click)="cancelEdit()">Abbrechen</button>
            </div>
          </ng-template>
        </article>
      </section>

      <ng-template #emptyState>
        <section class="card">
          <p>Keine offenen Einträge.</p>
        </section>
      </ng-template>

      <section class="card" *ngIf="store.completedItems().length">
        <h3>Erledigt</h3>
        <article class="list-item completed" *ngFor="let item of store.completedItems(); trackBy: trackById">
          <div>
            <strong>{{ item.name }}</strong>
            <span class="qty">x{{ item.quantity }}</span>
          </div>
          <div class="actions">
            <button type="button" (click)="markOpen(item.id)">Wieder offen</button>
            <button type="button" class="ghost" (click)="deleteItem(item.id)">Löschen</button>
          </div>
        </article>
      </section>
    </div>
  `,
  styleUrls: ["./shopping-list.page.css"]
})
export class ShoppingListPage implements OnInit {
  store = inject(ShoppingListStore);
  inventoryStore = inject(InventoryStore);

  manualName = "";
  manualQuantity = 1;
  alexaUtterance = "";
  editingId: string | null = null;
  editName = "";
  editQuantity = 1;

  private normalizedInventoryNames = computed(() =>
    this.inventoryStore
      .items()
      .filter((item) => item.quantity > 0)
      .map((item) => this.normalize(item.name))
  );

  ngOnInit() {
    this.store.loadItems();
    this.inventoryStore.loadItems();
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }

  addManualItem() {
    const name = this.manualName.trim();
    if (!name) {
      return;
    }

    this.store.createItem({
      name,
      quantity: Math.max(1, Number(this.manualQuantity || 1))
    });

    this.manualName = "";
    this.manualQuantity = 1;
  }

  importAlexa() {
    const utterance = this.alexaUtterance.trim();
    if (!utterance) {
      return;
    }

    this.store.importAlexa(utterance);
    this.alexaUtterance = "";
  }

  changeQty(id: string, next: number) {
    this.store.updateItem(id, { quantity: Math.max(1, next) });
  }

  markDone(id: string) {
    this.store.updateItem(id, { completed: true });
  }

  markOpen(id: string) {
    this.store.updateItem(id, { completed: false });
  }

  startEdit(item: ShoppingListItem) {
    this.editingId = item.id;
    this.editName = item.name;
    this.editQuantity = item.quantity;
  }

  cancelEdit() {
    this.editingId = null;
    this.editName = "";
    this.editQuantity = 1;
  }

  saveEdit(id: string) {
    const nextName = this.editName.trim();
    if (!nextName) {
      return;
    }
    this.store.updateItem(id, {
      name: nextName,
      quantity: Math.max(1, Number(this.editQuantity || 1))
    });
    this.cancelEdit();
  }

  deleteItem(id: string) {
    this.store.deleteItem(id);
  }

  isInInventory(name: string) {
    return this.normalizedInventoryNames().includes(this.normalize(name));
  }

  inventoryStatus(name: string) {
    return this.isInInventory(name) ? "Bereits im Inventar" : "Nicht im Inventar";
  }

  private normalize(value: string) {
    return value.toLowerCase().trim().replace(/\s+/g, " ");
  }
}
