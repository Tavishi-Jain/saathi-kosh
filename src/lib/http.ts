import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "जमा की गई जानकारी जाँचें।", details: error.issues }, { status: 400 });
  }
  if (error instanceof Error) {
    const status = /Unknown group member|not found|Select a group member/i.test(error.message) ? 404 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ error: "अनुरोध पूरा नहीं हो सका।" }, { status: 500 });
}

export async function readJson(request: Request, limitBytes = 64_000) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > limitBytes) throw new Error("अनुरोध बहुत बड़ा है।");
  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > limitBytes) throw new Error("अनुरोध बहुत बड़ा है।");
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error("अनुरोध का JSON सही नहीं है।");
  }
}

export function actorFrom(request: Request) {
  const actor = request.headers.get("x-demo-actor")?.trim() ?? "Treasurer";
  return actor.slice(0, 80) || "Treasurer";
}
