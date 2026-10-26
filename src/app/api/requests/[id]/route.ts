import { db } from "@/db";
import { pickRequests, requestEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid request ID." }, { status: 400 });
    const body = await request.json();
    if (!["pending", "picking", "completed"].includes(body.status)) return Response.json({ error: "Choose a valid request status." }, { status: 400 });
    const actor = typeof body.actor === "string" ? body.actor.trim().slice(0, 80) : "Warehouse team";
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(pickRequests).where(eq(pickRequests.id, id)).for("update");
      if (!existing) return null;
      if (existing.status === body.status) return existing;
      const now = new Date();
      const [updated] = await tx.update(pickRequests).set({
        status: body.status,
        pickedBy: body.status === "picking" ? actor : body.status === "pending" ? null : existing.pickedBy,
        pickedAt: body.status === "picking" ? now : body.status === "pending" ? null : existing.pickedAt,
        completedBy: body.status === "completed" ? actor : null,
        completedAt: body.status === "completed" ? now : null,
      }).where(eq(pickRequests.id, id)).returning();
      await tx.insert(requestEvents).values({ requestId: id, orderNumber: existing.orderNumber, actor: actor || "Team member", action: body.status === "pending" ? "reopened" : body.status });
      return updated;
    });
    return result ? Response.json({ ...result, attachment: result.attachment?.startsWith("data:") ? `/api/requests/${result.id}/attachment` : result.attachment }) : Response.json({ error: "This request could not be found." }, { status: 404 });
  } catch (error) {
    console.error("Failed to update request", error);
    return Response.json({ error: "Could not update this request. Please try again." }, { status: 500 });
  }
}
