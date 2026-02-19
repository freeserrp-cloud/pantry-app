import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { InventoryItem, InventoryItemCreate, InventoryItemUpdate } from "./inventory.models";

const API = "https://pantry-app-fm9y.onrender.com";

@Injectable({ providedIn: "root" })
export class InventoryApi {
  private http = inject(HttpClient);
  private baseUrl = `${API}/items`;

  list() {
    return this.http.get<InventoryItem[]>(this.baseUrl);
  }

  create(payload: InventoryItemCreate) {
    return this.http.post<InventoryItem>(this.baseUrl, payload);
  }

  update(id: string, payload: InventoryItemUpdate) {
    return this.http.put<InventoryItem>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  increment(id: string) {
    return this.http.post<InventoryItem>(`${this.baseUrl}/${id}/increment`, {});
  }

  decrement(id: string) {
    return this.http.post<InventoryItem>(`${this.baseUrl}/${id}/decrement`, {});
  }
}
