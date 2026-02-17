import { Component, OnInit, computed, effect, inject, signal } from "@angular/core";
import { NgIf } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";

import { InventoryStore } from "./inventory.store";

@Component({
  selector: "app-inventory-form",
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  template: `
    <section class="form-header">
      <a class="back" routerLink="/">Back</a>
      <h1>{{ isEdit() ? "Edit Item" : "Add Item" }}</h1>
      <p>Keep it simple. Update quantities anytime.</p>
    </section>

    <form class="item-form" [formGroup]="form" (ngSubmit)="submit()">
      <label>
        Name
        <input formControlName="name" placeholder="e.g. Milk" />
      </label>

      <label>
        Barcode
        <input formControlName="barcode" placeholder="Scanned code" />
      </label>

      <div class="image-preview" *ngIf="previewImageUrl()">
        <img [src]="previewImageUrl()" alt="Product image preview" />
      </div>

      <label>
        Category
        <input formControlName="category" placeholder="Optional" />
      </label>

      <div class="row">
        <label>
          Quantity
          <input type="number" min="0" formControlName="quantity" />
        </label>
        <label>
          Minimum
          <input type="number" min="0" formControlName="min_quantity" />
        </label>
      </div>

      <button class="primary" type="submit" [disabled]="form.invalid">
        {{ isEdit() ? "Save Changes" : "Create Item" }}
      </button>
    </form>
  `,
  styleUrls: ["./inventory-form.page.css"]
})
export class InventoryFormPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  store = inject(InventoryStore);

  private itemId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get("id"))),
    { initialValue: null }
  );

  private scannedBarcode = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get("barcode"))),
    { initialValue: null }
  );

  private scannedName = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get("name"))),
    { initialValue: null }
  );

  private scannedImageUrl = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get("imageUrl"))),
    { initialValue: null }
  );

  form = this.fb.group({
    name: ["", [Validators.required, Validators.maxLength(200)]],
    barcode: [""],
    category: [""],
    quantity: [0, [Validators.min(0)]],
    min_quantity: [0, [Validators.min(0)]]
  });

  private patched = signal(false);
  previewImageUrl = signal<string | null>(null);

  isEdit = computed(() => !!this.itemId());
  item = computed(() => {
    const id = this.itemId();
    return id ? this.store.getById(id) : null;
  });

  constructor() {
    effect(() => {
      const item = this.item();
      if (item && !this.patched()) {
        this.form.patchValue(
          {
            name: item.name,
            category: item.category ?? "",
            quantity: item.quantity,
            min_quantity: item.min_quantity
          },
          { emitEvent: false }
        );
        this.patched.set(true);
      }

      const barcode = this.scannedBarcode();
      const name = this.scannedName();
      const imageUrl = this.scannedImageUrl();
      if (barcode && !this.isEdit()) {
        this.form.patchValue(
          {
            barcode,
            name: this.form.value.name || name || barcode
          },
          { emitEvent: false }
        );
        this.previewImageUrl.set(imageUrl);
      }
    });
  }

  ngOnInit() {
    if (this.itemId() && this.store.items().length === 0) {
      this.store.loadItems();
    }
  }

  submit() {
    if (this.form.invalid) {
      return;
    }

    const payload = {
      name: this.form.value.name ?? "",
      category: this.form.value.category || null,
      quantity: Number(this.form.value.quantity ?? 0),
      min_quantity: Number(this.form.value.min_quantity ?? 0)
    };

    const id = this.itemId();
    if (id) {
      this.store.updateItem(id, payload);
    } else {
      this.store.createItem(payload);
    }

    this.router.navigateByUrl("/");
  }
}
