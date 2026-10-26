import { db } from "@/db";
import { pickRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Invalid request ID", { status: 400 });
    const [request] = await db.select({ attachment: pickRequests.attachment }).from(pickRequests).where(eq(pickRequests.id, id)).limit(1);
    const match = request?.attachment?.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return new Response("Visual note not found", { status: 404 });
    return new Response(new Uint8Array(Buffer.from(match[2], "base64")), {
      headers: { "Content-Type": match[1], "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    console.error("Could not load visual note", error);
    return new Response("Could not load visual note", { status: 500 });
  }
}
