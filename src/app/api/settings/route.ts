import { db } from "@/db";
import { workspaceSettings } from "@/db/schema";
import { ensureWorkspace } from "@/lib/workspace";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.soundEnabled !== "boolean" || !["chime", "bell", "beep"].includes(body.tone) || ![5, 10, 15, 30, 60].includes(body.repeatSeconds) || ![0, 30, 60, 120, 300].includes(body.durationSeconds) || !Number.isInteger(body.volume) || body.volume < 0 || body.volume > 100) {
      return Response.json({ error: "Please choose valid alert preferences." }, { status: 400 });
    }
    await ensureWorkspace();
    const [settings] = await db.update(workspaceSettings).set({ soundEnabled: body.soundEnabled, tone: body.tone, repeatSeconds: body.repeatSeconds, durationSeconds: body.durationSeconds, volume: body.volume }).where(eq(workspaceSettings.id, 1)).returning();
    return Response.json(settings);
  } catch (error) {
    console.error("Failed to save settings", error);
    return Response.json({ error: "Could not save your alert settings." }, { status: 500 });
  }
}
