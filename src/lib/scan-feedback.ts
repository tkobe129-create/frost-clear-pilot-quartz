let lastFeedbackAt = 0;

/**
 * Gives a short audible confirmation after a barcode is accepted. Speech
 * synthesis keeps this feature dependency-free and works on phones without
 * shipping an audio asset; the tone is a fallback for browsers without speech
 * synthesis support.
 */
export function announceScanSuccess(quantity: number, unit: string): void {
  if (typeof window === "undefined") return;

  const count = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const spokenUnit = unit.trim() || "件";
  const text = `成功扫码${count}${spokenUnit}`;
  const now = Date.now();

  // Avoid duplicate announcements if both native and ZXing detectors report
  // the same frame at nearly the same time.
  if (now - lastFeedbackAt < 250) return;
  lastFeedbackAt = now;

  try {
    const synthesis = window.speechSynthesis;
    if (synthesis && typeof SpeechSynthesisUtterance !== "undefined") {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 1.08;
      utterance.pitch = 1;
      utterance.volume = 1;
      const chineseVoice = synthesis
        .getVoices()
        .find((voice) => voice.lang.toLowerCase().startsWith("zh"));
      if (chineseVoice) utterance.voice = chineseVoice;

      // Do not let a long queue build up when someone scans a whole box of
      // items quickly. The latest confirmation should be heard immediately.
      synthesis.cancel();
      synthesis.speak(utterance);
      return;
    }
  } catch {
    // Fall through to the short tone.
  }

  playScanSuccessTone();
}

function playScanSuccessTone(): void {
  try {
    const AudioContextCtor = window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.17);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Audio is an enhancement; scanning remains successful if it is blocked.
  }
}
