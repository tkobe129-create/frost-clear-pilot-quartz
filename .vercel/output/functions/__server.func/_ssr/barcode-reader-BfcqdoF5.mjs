import { n as BarcodeFormat_default, r as DecodeHintType_default, t as BrowserMultiFormatReader } from "../_libs/@zxing/browser+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/barcode-reader-BfcqdoF5.js
var FORMATS = [
	BarcodeFormat_default.DATA_MATRIX,
	BarcodeFormat_default.QR_CODE,
	BarcodeFormat_default.CODE_128,
	BarcodeFormat_default.CODE_39,
	BarcodeFormat_default.CODE_93,
	BarcodeFormat_default.EAN_13,
	BarcodeFormat_default.EAN_8,
	BarcodeFormat_default.UPC_A,
	BarcodeFormat_default.UPC_E,
	BarcodeFormat_default.ITF,
	BarcodeFormat_default.CODABAR,
	BarcodeFormat_default.PDF_417,
	BarcodeFormat_default.AZTEC,
	BarcodeFormat_default.RSS_14,
	BarcodeFormat_default.RSS_EXPANDED,
	BarcodeFormat_default.MAXICODE
];
var NATIVE_FORMATS = [
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
	"upc_e"
];
async function createNativeDetector() {
	const Ctor = window.BarcodeDetector;
	if (!Ctor) return null;
	let formats = [...NATIVE_FORMATS];
	try {
		if (typeof Ctor.getSupportedFormats === "function") {
			const supported = await Ctor.getSupportedFormats();
			formats = formats.filter((f) => supported.includes(f));
		}
	} catch {}
	if (formats.length === 0) return null;
	try {
		return new Ctor({ formats });
	} catch {
		try {
			return new Ctor({ formats: [
				"qr_code",
				"code_128",
				"data_matrix",
				"ean_13"
			] });
		} catch {
			return null;
		}
	}
}
function createZxingReader() {
	const hints = /* @__PURE__ */ new Map();
	hints.set(DecodeHintType_default.POSSIBLE_FORMATS, FORMATS);
	hints.set(DecodeHintType_default.TRY_HARDER, true);
	hints.set(DecodeHintType_default.ASSUME_GS1, true);
	hints.set(DecodeHintType_default.CHARACTER_SET, "UTF-8");
	return new BrowserMultiFormatReader(hints, {
		delayBetweenScanAttempts: 80,
		delayBetweenScanSuccess: 1200,
		tryPlayVideoTimeout: 12e3
	});
}
async function openBackCamera() {
	const attempts = [
		{
			audio: false,
			video: {
				facingMode: { exact: "environment" },
				width: { ideal: 1920 },
				height: { ideal: 1080 }
			}
		},
		{
			audio: false,
			video: {
				facingMode: { ideal: "environment" },
				width: { ideal: 1280 },
				height: { ideal: 720 }
			}
		},
		{
			audio: false,
			video: { facingMode: "environment" }
		},
		{
			audio: false,
			video: true
		}
	];
	let last;
	for (const constraints of attempts) try {
		return await navigator.mediaDevices.getUserMedia(constraints);
	} catch (err) {
		last = err;
	}
	throw last instanceof Error ? last : /* @__PURE__ */ new Error("无法打开摄像头");
}
function prepareVideo(video, stream) {
	video.setAttribute("playsinline", "true");
	video.setAttribute("webkit-playsinline", "true");
	video.muted = true;
	video.playsInline = true;
	video.autoplay = true;
	video.srcObject = stream;
}
function waitForVideo(video, timeoutMs = 8e3) {
	if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => {
			cleanup();
			reject(/* @__PURE__ */ new Error("摄像头画面超时"));
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
function decodeCanvas(reader, canvas) {
	try {
		return reader.decodeFromCanvas(canvas)?.getText()?.trim() || null;
	} catch {
		return null;
	}
}
function drawVideoFrame(video, canvas, ctx, mode, invert = false) {
	const vw = video.videoWidth;
	const vh = video.videoHeight;
	if (!vw || !vh) return;
	const scale = Math.min(1, 960 / vw);
	if (mode === "band") {
		const bandH = Math.max(80, Math.floor(vh * .42));
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
//#endregion
export { createNativeDetector, createZxingReader, decodeCanvas, drawVideoFrame, openBackCamera, prepareVideo, waitForVideo };
