import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from "@angular/core";
import { NgIf } from "@angular/common";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

@Component({
  selector: "app-barcode-scanner",
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="scanner">
      <video #video class="scanner-video" playsinline muted></video>
      <div class="scanner-frame"></div>
      <p class="scanner-hint">Align the barcode inside the frame</p>
      <p class="scanner-error" *ngIf="errorMessage">{{ errorMessage }}</p>
    </div>
  `,
  styleUrls: ["./barcode-scanner.component.css"]
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild("video", { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  @Output() detected = new EventEmitter<string>();
  @Output() error = new EventEmitter<string>();

  errorMessage: string | null = null;
  private readonly hints = new Map<DecodeHintType, unknown>([
    [
      DecodeHintType.POSSIBLE_FORMATS,
      [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128
      ]
    ]
  ]);
  private reader = new BrowserMultiFormatReader(this.hints, {
    delayBetweenScanAttempts: 120,
    delayBetweenScanSuccess: 250
  });
  private stream: MediaStream | null = null;
  private active = false;

  ngAfterViewInit() {
    void this.start();
  }

  ngOnDestroy() {
    this.stop();
  }

  private async start() {
    if (this.active) {
      return;
    }
    this.active = true;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 480 },
          height: { ideal: 360 },
          frameRate: { ideal: 30, max: 60 }
        }
      });
      const videoEl = this.videoRef.nativeElement;
      videoEl.srcObject = this.stream;
      await videoEl.play();
      const track = this.stream.getVideoTracks()[0];
      const deviceId = track?.getSettings().deviceId;

      await this.reader.decodeFromVideoDevice(
        deviceId,
        videoEl,
        (result: any, err: unknown) => {
          if (!this.active) {
            return;
          }

          if (result) {
            const text = typeof result.getText === "function" ? result.getText() : null;
            if (text) {
              this.detected.emit(text);
              this.stop();
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

  private stop() {
    if (!this.active && !this.videoRef?.nativeElement) {
      return;
    }
    this.active = false;
    const video = this.videoRef?.nativeElement;
    const stream = video?.srcObject as MediaStream | null;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
