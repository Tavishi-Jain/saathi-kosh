import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { settingsSchema } from "@/lib/domain";
import { actorFrom, errorResponse, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await prisma.groupSettings.findUniqueOrThrow({ where: { id: "group" } }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const settings = settingsSchema.parse(await readJson(request));
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.groupSettings.update({ where: { id: "group" }, data: settings });
      await appendAudit(tx, {
        actor: actorFrom(request),
        eventType: "GROUP_SETTINGS_UPDATED",
        entityRef: "group",
        payload: settings,
      });
      return result;
    });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
