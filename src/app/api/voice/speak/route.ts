import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, readJson } from "@/lib/http";
import { allowVoiceRequest, synthesizeSpeech } from "@/lib/voice";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!allowVoiceRequest(request, "speak", 5)) {
      return NextResponse.json({ error: "कृपया एक मिनट बाद फिर कोशिश करें।" }, { status: 429 });
    }
    const { text } = z.object({ text: z.string().trim().min(1).max(1500) }).parse(await readJson(request));
    const audioBase64 = await synthesizeSpeech(text);
    return NextResponse.json({ audioBase64, contentType: "audio/mpeg" });
  } catch (error) {
    return errorResponse(error);
  }
}
