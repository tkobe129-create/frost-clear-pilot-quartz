import { useEffect, useRef, useState } from "react";
import { CameraOff, Flashlight, FlashlightOff, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onDetect: (value: string) => void;
};

export function ScannerOverlay({ open, onClose, onDetect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("正在打开摄像头…");
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const lastValue = useRef("");
  const onDetectRef = useRef(onDetect);
  const streamRef = useRef<MediaStream | null>(null);
  onDetectRef.current = onDetect;

  useEffect(() => {
    if (!open) return;
    lastValue.current = "";
    setError("");
    setTorchOn(false);
    setTorchAvailable(false);
    setStatus("正在打开摄像头…");

    let stopped = false;
    let timer: number | null = null;
    let cooldownTimer: number | null = null;
    let stream: MediaStream | null = null;

    const emit = (value: string) => {
      const v = value.trim();
      if (!v || v === lastValue.current) return;
      lastValue.current = v;
      // Allow the same barcode to be scanned again after a short cooldown (continuous mode)
      if (cooldownTimer) window.clearTimeout(cooldownTimer);
      cooldownTimer = window.setTimeout(() => {
        lastValue.current = "";
      }, 1200);
      try {
        navigator.vibrate?.(40);
      } catch {
        /* ignore */
      }
      onDetectRef.current(v);
    };

    (async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        const {
          createNativeDetector,
          createZxingReader,
          decodeCanvas,
          drawVideoFrame,
          openBackCamera,
          prepareVideo,
          waitForVideo,
        } = await import("@/lib/barcode-reader");

        const camStream = await openBackCamera();
        stream = camStream;
        if (stopped) {
          camStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = camStream;
        prepareVideo(video, camStream);
        try {
          await video.play();
        } catch {
          /* iOS may autoplay after srcObject */
        }
        await waitForVideo(video);
        if (stopped) return;

        const track = camStream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as { torch?: boolean } | undefined;
        if (caps?.torch) setTorchAvailable(true);

        setStatus("连续扫码中 · 识别成功后可继续扫描");

        const reader = createZxingReader();
        const detector = await createNativeDetector();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("无法创建画布");

        let frame = 0;
        let busy = false;

        const tick = async () => {
          if (stopped) return;
          if (!busy && video.readyState >= 2 && video.videoWidth > 0) {
            busy = true;
            try {
              const mode = frame % 2 === 0 ? "band" : "full";
              const invert = frame % 6 === 5;
              drawVideoFrame(video, canvas, ctx, mode, invert);

              const zxingText = decodeCanvas(reader, canvas);
              if (zxingText) {
                emit(zxingText);
                busy = false;
                return;
              }

              if (detector) {
                try {
                  const codes = await detector.detect(canvas);
                  const nativeText = codes[0]?.rawValue?.trim();
                  if (nativeText) emit(nativeText);
                } catch {
                  /* Safari may reject some canvas frames */
                }
              }
              frame += 1;
            } finally {
              busy = false;
            }
          }
          timer = window.setTimeout(() => void tick(), 70);
        };
        void tick();
      } catch (err) {
        if (stopped) return;
        const message = err instanceof Error ? err.message : "无法打开摄像头";
        const denied = /permission|notallowed|denied/i.test(message);
        setError(denied ? "未获得相机权限，请改用相册或粘贴条码" : "无法识别画面，请改用相册拍照或粘贴条码");
        setStatus("");
      }
    })();

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      if (cooldownTimer) window.clearTimeout(cooldownTimer);
      stream?.getTracks().forEach((t) => t.stop());
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
    };
  }, [open]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] as unknown as MediaTrackConstraintSet[] });
      setTorchOn(next);
    } catch {
      setTorchAvailable(false);
    }
  }

  async function onPickFile(file: File) {
    setError("");
    setStatus("正在识别照片…");
    try {
      const { createNativeDetector, createZxingReader, decodeCanvas } = await import("@/lib/barcode-reader");
      const bmp = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(bmp, 0, 0);
      bmp.close();

      const reader = createZxingReader();
      const text = decodeCanvas(reader, canvas);
      if (text) {
        onDetect(text);
        return;
      }
      const detector = await createNativeDetector();
      if (detector) {
        const codes = await detector.detect(canvas);
        if (codes[0]?.rawValue) {
          onDetect(codes[0].rawValue);
          return;
        }
      }
      const { Html5Qrcode } = await import("html5-qrcode");
      const fallback = new Html5Qrcode("qd-html5-file");
      const scanned = await fallback.scanFile(file, false);
      await fallback.clear();
      if (scanned) onDetect(scanned);
      else setError("未识别到条码，请换一张更清晰、条码更大的照片");
    } catch {
      setError("未识别到条码，请让条码充满画面后重拍，或改用粘贴");
      setStatus("");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex h-dvh w-full flex-col bg-fg text-primary-fg">
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <p className="text-sm font-medium">连续扫码</p>
        <div className="flex items-center">
          {torchAvailable ? (
            <button
              type="button"
              onClick={() => void toggleTorch()}
              className="flex size-11 items-center justify-center rounded-md text-primary-fg"
              aria-label={torchOn ? "关闭手电筒" : "打开手电筒"}
            >
              {torchOn ? <Flashlight className="size-5" /> : <FlashlightOff className="size-5" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-md text-primary-fg"
            aria-label="关闭扫码"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
      <div className="relative mx-4 min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg bg-fg">
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-28 w-[86%] overflow-hidden rounded-md border-2 border-primary-fg/90 shadow-[0_0_0_9999px_rgba(28,29,26,0.42)]">
            <div className="scan-line absolute inset-x-3 h-0.5 bg-primary-fg/90" />
          </div>
        </div>
      </div>
      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <p className="min-h-5 text-center text-xs text-primary-fg/75">{error || status}</p>
        <p className="mt-1 text-center text-[11px] text-primary-fg/50">
          识别成功后自动加入待提交，可连续扫描多个条码，完成后点右上角关闭
        </p>
        {error ? (
          <div className="mt-3 flex items-center justify-center gap-2 text-subtle">
            <CameraOff className="size-4" />
            <span className="text-xs">可从相册识别，或返回后粘贴条码</span>
          </div>
        ) : null}
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            className="h-12 flex-1 bg-surface text-fg hover:bg-bg-elevated"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            拍照 / 相册识别
          </Button>
          <Button
            variant="outline"
            className={cn("h-12 border-primary-fg/20 bg-transparent text-primary-fg")}
            onClick={onClose}
          >
            完成
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onPickFile(file);
            e.target.value = "";
          }}
        />
        <div id="qd-html5-file" className="hidden" />
      </div>
    </div>
  );
}
