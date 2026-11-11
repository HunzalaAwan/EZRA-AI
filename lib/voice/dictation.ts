/**
 * Dictation: speech in, text out, for the owner talking to the product (not
 * for calls, which are the agent runtime's job).
 *
 * This is the interface the UI depends on. During the frontend phase it is
 * backed by the browser's own speech recognition, which Chrome, Edge and
 * Safari provide. Those browsers may send the audio to their vendor's servers
 * to transcribe it, so production should back this same interface with EZRA's
 * own transcription. Nothing outside this file knows which one is in use.
 */

export type DictationError = "blocked" | "silence" | "failed";

export interface Dictation {
  stop(): void;
}

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Call from an effect or a handler, never during render: the server has no window. */
export function dictationSupported() {
  return ctor() !== null;
}

/**
 * Starts listening. `onText` receives the whole transcript so far, interim
 * words included, each time it changes. `onEnd` fires once, however it ends.
 */
export function startDictation({
  lang = "en-US",
  onText,
  onEnd,
  onError,
}: {
  lang?: string;
  onText: (text: string) => void;
  onEnd: () => void;
  onError: (e: DictationError) => void;
}): Dictation {
  const Ctor = ctor();
  if (!Ctor) {
    onError("failed");
    onEnd();
    return { stop() {} };
  }
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = true;

  let settled = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]!;
      if (r.isFinal) settled += r[0].transcript;
      else interim += r[0].transcript;
    }
    onText(`${settled}${interim}`.replace(/\s+/g, " ").trim());
  };
  rec.onerror = (e) =>
    onError(
      e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "blocked"
        : e.error === "no-speech"
          ? "silence"
          : "failed",
    );
  rec.onend = onEnd;

  try {
    rec.start();
  } catch {
    onError("failed");
    onEnd();
  }
  return { stop: () => rec.stop() };
}
