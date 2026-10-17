import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseTransactionTranscript } from "@/lib/domain";
import { allowVoiceRequest, getMaxAudioSeconds, getVoiceStatus, transcribeVoice } from "@/lib/voice";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!allowVoiceRequest(request, "transcribe")) return NextResponse.json({ error: "कृपया एक मिनट बाद फिर कोशिश करें।" }, { status: 429 });
    if (Number(request.headers.get("content-length") ?? 0) > Number(process.env.MAX_AUDIO_BYTES ?? 5_000_000) + 100_000) {
      return NextResponse.json({ error: "ऑडियो फ़ाइल बहुत बड़ी है (अधिकतम 5 MB)।" }, { status: 413 });
    }
    const form = await request.formData();
    const audio = form.get("audio");
    if (audio instanceof File) {
      const duration = Number(form.get("duration") ?? 0);
      if (duration > getMaxAudioSeconds()) {
        return NextResponse.json({ error: `रिकॉर्डिंग अधिकतम ${getMaxAudioSeconds()} सेकंड की हो सकती है।` }, { status: 400 });
      }
    }
    const transcript = await transcribeVoice(form);
    const members = await prisma.member.findMany({ select: { name: true } });
    const parsed = parseTransactionTranscript(transcript, members.map((member) => member.name));
    return NextResponse.json({ transcript, ...parsed, providerStatus: getVoiceStatus() });
  } catch (error) {
    return errorResponse(error);
  }
}
