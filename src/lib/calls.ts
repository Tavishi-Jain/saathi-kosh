import { prisma } from "@/lib/db";

export const DEMO_GROUP_KEY = "sakhi-demo-group";
export const ACTIVE_CALL_STATUSES = ["RINGING", "ACCEPTED", "CONNECTED"] as const;

export function liveKitConfigured() {
  const [url, key, secret] = [
    process.env.LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
  ].map((value) => value?.trim());
  return Boolean(
    url?.startsWith("wss://") &&
    key && secret &&
    ![url, key, secret].some((value) => /your-|placeholder|replace[-_ ]?me/i.test(value)),
  );
}

export async function callMemberFromRequest(request: Request) {
  const name = request.headers.get("x-demo-actor")?.trim();
  if (!name || name.length > 80) return null;
  return prisma.member.findUnique({ where: { name }, select: { id: true, name: true } });
}
