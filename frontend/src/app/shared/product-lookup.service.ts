import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map, catchError, of } from "rxjs";

export interface ProductLookupResult {
  barcode: string;
  name?: string;
  imageUrl?: string;
  brand?: string;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    image_url?: string;
    brands?: string;
  };
}

@Injectable({ providedIn: "root" })
export class ProductLookupService {
  private http = inject(HttpClient);

  lookup(barcode: string) {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    return this.http.get<OpenFoodFactsResponse>(url).pipe(
      map((response) => {
        if (response.status !== 1 || !response.product) {
          return null;
        }

        const name = response.product.product_name?.trim();
        const imageUrl = response.product.image_url?.trim();
        const brand = response.product.brands?.split(",")[0]?.trim();

        return {
          barcode,
          name: name || undefined,
          imageUrl: imageUrl || undefined,
          brand: brand || undefined
        } satisfies ProductLookupResult;
      }),
      catchError(() => of(null))
    );
  }
}
