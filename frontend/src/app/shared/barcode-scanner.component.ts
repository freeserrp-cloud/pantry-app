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
  private lastCandidate: string | null = null;
  private stableReadCount = 0;
  private readonly requiredStableReads = 2;

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
              const format = typeof result.getBarcodeFormat === "function" ? (result.getBarcodeFormat() as BarcodeFormat) : null;
              const candidate = this.extractBarcodeCandidate(text, format);
              if (!candidate) {
                this.resetStableRead();
                return;
              }

              if (candidate === this.lastCandidate) {
                this.stableReadCount += 1;
              } else {
                this.lastCandidate = candidate;
                this.stableReadCount = 1;
              }

              if (this.stableReadCount >= this.requiredStableReads) {
                this.detected.emit(candidate);
                this.stop();
              }
            }
            return;
          }

          const error = err as { name?: string } | null;
          if (this.isTransientDecodeError(error?.name)) {
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
    this.resetStableRead();
  }

  private resetStableRead() {
    this.lastCandidate = null;
    this.stableReadCount = 0;
  }

  private isTransientDecodeError(name?: string) {
    return (
      name === "NotFoundException"
      || name === "ChecksumException"
      || name === "FormatException"
    );
  }

  private extractBarcodeCandidate(value: string, format: BarcodeFormat | null) {
    const raw = value.trim();
    if (!raw) {
      return null;
    }

    const digitsOnly = raw.replace(/\D/g, "");
    const fromAi01 = this.extractAi01(digitsOnly);
    if (format === BarcodeFormat.CODE_128 && !fromAi01) {
      return null;
    }

    const base = fromAi01 ?? digitsOnly;
    if (!base) {
      return null;
    }

    let normalized = base;
    if (normalized.length === 14 && normalized.startsWith("0")) {
      normalized = normalized.slice(1);
    }
    if (normalized.length === 13 && normalized.startsWith("0")) {
      normalized = normalized.slice(1);
    }

    if (normalized.length === 8 || normalized.length === 12 || normalized.length === 13 || normalized.length === 14) {
      if (!this.isValidGtin(normalized)) {
        return null;
      }
      if (normalized.length === 14 && normalized.startsWith("0")) {
        return normalized.slice(1);
      }
      return normalized;
    }
    return null;
  }

  private extractAi01(input: string) {
    if (!input) {
      return null;
    }
    const aiMarker = "01";
    const index = input.indexOf(aiMarker);
    if (index === -1) {
      return null;
    }
    const start = index + aiMarker.length;
    const end = start + 14;
    if (input.length < end) {
      return null;
    }
    return input.slice(start, end);
  }

  private isValidGtin(digits: string) {
    if (!/^\d+$/.test(digits)) {
      return false;
    }
    if (digits.length < 8 || digits.length > 14) {
      return false;
    }

    const body = digits.slice(0, -1);
    const checkDigit = Number(digits[digits.length - 1]);
    let sum = 0;
    let multiplier = 3;

    for (let i = body.length - 1; i >= 0; i -= 1) {
      sum += Number(body[i]) * multiplier;
      multiplier = multiplier === 3 ? 1 : 3;
    }

    const computed = (10 - (sum % 10)) % 10;
    return computed === checkDigit;
  }
}
