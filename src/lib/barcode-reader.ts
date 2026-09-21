import { BarcodeFormat, BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";

const FORMATS: BarcodeFormat[] = [
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
  BarcodeFormat.PDF_417,
  BarcodeFormat.AZTEC,
  BarcodeFormat.RSS_14,
  BarcodeFormat.RSS_EXPANDED,
  BarcodeFormat.MAXICODE,
];

const NATIVE_FORMATS = [
  "aztec",
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "data_matrix",
  "ean_13",
  "ean_8",
  "itf",
  "pdf417",
  "qr_code",
  "upc_a",
  "upc_e",
] as const;

export type NativeDetector = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

export async function createNativeDetector(): Promise<NativeDetector | null> {
  const Ctor = (
    window as unknown as {
      BarcodeDetector?: {
        new (o: { formats: string[] }): NativeDetector;
        getSupportedFormats?: () => Promise<string[]>;
      };
    }
  ).BarcodeDetector;
  if (!Ctor) return null;
  let formats: string[] = [...NATIVE_FORMATS];
  try {
    if (typeof Ctor.getSupportedFormats === "function") {
      const supported = await Ctor.getSupportedFormats();
      formats = formats.filter((f) => supported.includes(f));
    }
  } catch {
    /* ignore */
  }
  if (formats.length === 0) return null;
  try {
    return new Ctor({ formats });
  } catch {
    try {
      return new Ctor({ formats: ["qr_code", "code_128", "data_matrix", "ean_13"] });
    } catch {
      return null;
    }
  }
}

export function createZxingReader(): BrowserMultiFormatReader {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.ASSUME_GS1, true);
  hints.set(DecodeHintType.CHARACTER_SET, "UTF-8");
  return new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: 80,
    delayBetweenScanSuccess: 1200,
    tryPlayVideoTimeout: 12000,
  });
}

export async function openBackCamera(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    {
      audio: false,
      video: {
        facingMode: { exact: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    },
    {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    { audio: false, video: { facingMode: "environment" } },
    { audio: false, video: true },
  ];
  let last: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error("无法打开摄像头");
}

export function prepareVideo(video: HTMLVideoElement, stream: MediaStream) {
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.srcObject = stream;
}

export function waitForVideo(video: HTMLVideoElement, timeoutMs = 8000): Promise<void> {
  if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("摄像头画面超时"));
    }, timeoutMs);
    const onReady = () => {
      if (video.videoWidth > 0) {
        cleanup();
        resolve();
      }
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("playing", onReady);
    };
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("playing", onReady);
  });
}

export function decodeCanvas(reader: BrowserMultiFormatReader, canvas: HTMLCanvasElement): string | null {
  try {
    const result = reader.decodeFromCanvas(canvas);
    const text = result?.getText()?.trim();
    return text || null;
  } catch {
    return null;
  }
}

export function drawVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  mode: "full" | "band",
  invert = false,
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;
  const maxW = 960;
  const scale = Math.min(1, maxW / vw);
  if (mode === "band") {
    const bandH = Math.max(80, Math.floor(vh * 0.42));
    const bandY = Math.floor((vh - bandH) / 2);
    canvas.width = Math.max(1, Math.floor(vw * scale));
    canvas.height = Math.max(1, Math.floor(bandH * scale));
    ctx.filter = invert ? "invert(1)" : "none";
    ctx.drawImage(video, 0, bandY, vw, bandH, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    return;
  }
  canvas.width = Math.max(1, Math.floor(vw * scale));
  canvas.height = Math.max(1, Math.floor(vh * scale));
  ctx.filter = invert ? "invert(1)" : "none";
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.filter = "none";
}
