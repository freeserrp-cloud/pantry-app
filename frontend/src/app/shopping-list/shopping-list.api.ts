import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { environment } from "../../environments/environment";
import { AlexaImportResult, ShoppingListItem, ShoppingListItemCreate, ShoppingListItemUpdate } from "./shopping-list.models";

@Injectable({ providedIn: "root" })
export class ShoppingListApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/shopping-list`;

  list() {
    return this.http.get<ShoppingListItem[]>(this.baseUrl);
  }

  create(payload: ShoppingListItemCreate) {
    return this.http.post<ShoppingListItem>(this.baseUrl, payload);
  }

  update(id: string, payload: ShoppingListItemUpdate) {
    return this.http.put<ShoppingListItem>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  importAlexa(utterance: string) {
    return this.http.post<AlexaImportResult>(`${this.baseUrl}/alexa-import`, { utterance });
  }
}
