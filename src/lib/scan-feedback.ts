let lastFeedbackAt = 0;
let audioContext: AudioContext | null = null;

type AudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;
  const AudioContextCtor = window.AudioContext || (window as AudioContextWindow).webkitAudioContext;
  if (!AudioContextCtor) return null;
  try {
    audioContext = new AudioContextCtor();
    return audioContext;
  } catch {
    return null;
  }
}

/** Call this from a user gesture before opening the camera. */
export function unlockScanAudio(): void {
  const context = getAudioContext();
  if (context?.state === "suspended") void context.resume().catch(() => undefined);

  // iOS Safari can also gate speech synthesis until the first user gesture.
  try {
    const synthesis = window.speechSynthesis;
    synthesis?.getVoices();
    synthesis?.resume();
    synthesis?.cancel();
  } catch {
    // Audio is an enhancement; scanning remains available.
  }
}

/**
 * Gives an audible confirmation after a barcode is accepted. It intentionally
 * plays both a short tone and speech: some mobile browsers expose
 * speechSynthesis but keep it silent, while others block Web Audio until the
 * camera button has been tapped.
 */
export function announceScanSuccess(quantity: number, unit: string): void {
  if (typeof window === "undefined") return;

  const count = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const spokenUnit = unit.trim() || "件";
  const text = `成功扫码${count}${spokenUnit}`;
  const now = Date.now();

  // Avoid duplicate announcements if two detectors report the same frame.
  if (now - lastFeedbackAt < 250) return;
  lastFeedbackAt = now;

  playScanSuccessTone();

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

      // Do not let a long queue build up during rapid continuous scanning.
      synthesis.cancel();
      synthesis.speak(utterance);
    }
  } catch {
    // The tone above remains as feedback if speech is unavailable.
  }
}

function playScanSuccessTone(): void {
  const context = getAudioContext();
  if (!context) return;

  const play = () => {
    try {
      const start = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, start);
      oscillator.frequency.setValueAtTime(1175, start + 0.09);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.32, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.23);
    } catch {
      // Audio is an enhancement; scanning remains successful if it is blocked.
    }
  };

  if (context.state === "suspended") {
    void context.resume().then(play).catch(() => undefined);
  } else {
    play();
  }
}
