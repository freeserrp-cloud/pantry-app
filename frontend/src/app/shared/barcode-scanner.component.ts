import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild, inject } from "@angular/core";
import { NgIf } from "@angular/common";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { finalize } from "rxjs";

import { ProductLookupService, ProductLookupResult } from "./product-lookup.service";

@Component({
  selector: "app-barcode-scanner",
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="scanner">
      <video #video class="scanner-video" playsinline muted></video>
      <div class="scanner-frame"></div>
      <p class="scanner-hint">Align the barcode inside the frame</p>
      <p class="scanner-loading" *ngIf="loading">Looking up product...</p>
      <p class="scanner-error" *ngIf="errorMessage">{{ errorMessage }}</p>
    </div>
  `,
  styleUrls: ["./barcode-scanner.component.css"]
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild("video", { static: true }) video!: ElementRef<HTMLVideoElement>;

  @Output() detected = new EventEmitter<ProductLookupResult | { barcode: string }>();
  @Output() error = new EventEmitter<string>();

  errorMessage: string | null = null;
  loading = false;

  private lookup = inject(ProductLookupService);

  private reader: BrowserMultiFormatReader | null = null;
  private active = false;

  ngAfterViewInit() {
    this.start();
  }

  ngOnDestroy() {
    this.stop();
  }

  private async start() {
    this.active = true;
    this.reader = new BrowserMultiFormatReader();

    try {
      await this.reader.decodeFromVideoDevice(
        undefined,
        this.video.nativeElement,
        (result: any, err: unknown) => {
          if (!this.active) {
            return;
          }

          if (result) {
            const text = typeof result.getText === "function" ? result.getText() : null;
            if (text) {
              this.lookupProduct(text);
            }
            return;
          }

          const error = err as { name?: string } | null;
          if (error?.name === "NotFoundException") {
            return;
          }

          if (err) {
            this.handleError("Unable to read barcode. Try again.");
          }
        }
      );
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        this.handleError("Camera permission denied.");
      } else if (err?.name === "NotFoundError") {
        this.handleError("No camera found on this device.");
      } else {
        this.handleError("Unable to access the camera.");
      }
    }
  }

  private handleError(message: string) {
    if (!this.active) {
      return;
    }
    this.errorMessage = message;
    this.error.emit(message);
  }

  private lookupProduct(barcode: string) {
    if (!this.active || this.loading) {
      return;
    }
    this.loading = true;
    this.lookup
      .lookup(barcode)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          if (!this.active) {
            return;
          }
          if (result) {
            this.detected.emit(result);
          } else {
            this.detected.emit({ barcode });
          }
          this.stop();
        },
        error: () => {
          if (!this.active) {
            return;
          }
          this.detected.emit({ barcode });
          this.stop();
        }
      });
  }

  private stop() {
    this.active = false;
    const videoEl = this.video?.nativeElement;
    const stream = videoEl?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoEl) {
      videoEl.srcObject = null;
    }
    this.reader = null;
  }
}
