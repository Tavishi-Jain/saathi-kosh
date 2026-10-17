import { z } from "zod";
import { parseBuffer } from "music-metadata";

const transcriptSchema = z.object({ text: z.string().trim().min(1).max(8000) });
const audioTypes = new Set(["audio/webm", "audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/x-m4a"]);
const MAX_BYTES = Number(process.env.MAX_AUDIO_BYTES ?? 5_000_000);
const voiceRequests = new Map<string, number[]>();
let providerError = false;

export function getVoiceStatus() {
  if (process.env.VOICE_MODE !== "elevenlabs") return "Mock Mode" as const;
  return process.env.ELEVENLABS_API_KEY && !providerError
    ? "Voice API Connected" as const
    : "Voice API Error" as const;
}

export function getMaxAudioSeconds() {
  const configured = Number(process.env.MAX_AUDIO_SECONDS ?? 30);
  return Number.isInteger(configured) && configured >= 1 && configured <= 120 ? configured : 30;
}

export function allowVoiceRequest(request: Request, category: string, limit = 8) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${category}:${ip}`;
  const now = Date.now();
  const recent = (voiceRequests.get(key) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= limit) return false;
  recent.push(now);
  voiceRequests.set(key, recent);
  return true;
}

export async function transcribeVoice(form: FormData) {
  const text = form.get("text");
  const audio = form.get("audio");
  if (typeof text === "string" && text.trim() && audio instanceof File && audio.size) {
    throw new Error("एक समय में लिखित वाक्य या ऑडियो में से एक चुनें।");
  }
  if (typeof text === "string" && text.trim()) return transcriptSchema.parse({ text }).text;

  if (!(audio instanceof File) || !audio.size) throw new Error("रिकॉर्डिंग या लिखा हुआ वाक्य जोड़ें।");
  if (audio.size > MAX_BYTES) throw new Error("ऑडियो फ़ाइल बहुत बड़ी है (अधिकतम 5 MB)।");
  const mimeType = audio.type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!audioTypes.has(mimeType)) throw new Error("इस ऑडियो फ़ॉर्मैट का समर्थन नहीं है।");
  let duration: number | undefined;
  try {
    const metadata = await parseBuffer(new Uint8Array(await audio.arrayBuffer()), { mimeType });
    duration = metadata.format.duration;
  } catch {
    throw new Error("ऑडियो की अवधि पढ़ नहीं सके। दूसरी फ़ाइल चुनें या वाक्य टाइप करें।");
  }
  const maxDuration = getMaxAudioSeconds();
  if (!duration || duration > maxDuration) {
    throw new Error(`रिकॉर्डिंग अधिकतम ${maxDuration} सेकंड की हो सकती है।`);
  }
  if (process.env.VOICE_MODE !== "elevenlabs") {
    throw new Error("Mock Mode में आवाज़ आपके डिवाइस से बाहर नहीं जाती। उदाहरण चुनें या सुना हुआ वाक्य टाइप करें।");
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Voice API उपलब्ध नहीं है। आप वाक्य टाइप करके जारी रख सकते हैं।");

  const providerForm = new FormData();
  providerForm.append("file", audio, audio.name || "voice-note.webm");
  providerForm.append("model_id", process.env.ELEVENLABS_STT_MODEL || "scribe_v2");
  providerForm.append("language_code", process.env.ELEVENLABS_LANGUAGE_CODE || "hi");
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: providerForm,
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) {
      providerError = true;
      throw new Error("Voice API ने ऑडियो नहीं पढ़ा। कृपया लिखकर जारी रखें।");
    }
    const result = z.object({ text: z.string().min(1) }).parse(await response.json());
    providerError = false;
    return result.text;
  } catch (error) {
    providerError = true;
    if (error instanceof Error && error.message.includes("Voice API")) throw error;
    throw new Error("Voice API इस समय उपलब्ध नहीं है। कृपया लिखकर जारी रखें।");
  }
}

export async function synthesizeSpeech(text: string) {
  const safeText = z.string().trim().min(1).max(1500).parse(text);
  if (process.env.VOICE_MODE !== "elevenlabs") throw new Error("स्पीच डेमो मोड में उपलब्ध नहीं है।");
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) throw new Error("वाणी सेवा कॉन्फ़िगर नहीं है; पाठ उपलब्ध है।");
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: safeText,
        model_id: process.env.ELEVENLABS_TTS_MODEL || "eleven_flash_v2_5",
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) {
      providerError = true;
      throw new Error("स्पीच सेवा इस समय उपलब्ध नहीं है; पाठ जारी है।");
    }
    providerError = false;
    return Buffer.from(await response.arrayBuffer()).toString("base64");
  } catch (error) {
    providerError = true;
    if (error instanceof Error && error.message.includes("स्पीच सेवा")) throw error;
    throw new Error("स्पीच सेवा इस समय उपलब्ध नहीं है; पाठ जारी है।");
  }
}
