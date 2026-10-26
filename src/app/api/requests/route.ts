import { db } from "@/db";
import { pickRequests, requestEvents } from "@/db/schema";
import { getDashboardData, ensureWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getDashboardData(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load workspace", error);
    return Response.json({ error: "Unable to connect to the workspace. Please try again." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim().replace(/^#/, "") : "";
    if (!/^[a-zA-Z0-9][a-zA-Z0-9 /-]{0,39}$/.test(orderNumber)) return Response.json({ error: "Enter a valid order number (up to 40 characters)." }, { status: 400 });
    const customer = typeof body.customer === "string" ? body.customer.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const createdBy = typeof body.createdBy === "string" ? body.createdBy.trim() : "Jamie Davis";
    if (customer.length > 120 || message.length > 1500 || !createdBy || createdBy.length > 80) return Response.json({ error: "One of the fields is too long. Please shorten it and try again." }, { status: 400 });
    const attachment = typeof body.attachment === "string" ? body.attachment : null;
    if (attachment && (attachment.length > 7_000_000 || !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(attachment))) return Response.json({ error: "Please attach a PNG, JPG, WebP, or GIF image under 5 MB." }, { status: 400 });
    const attachmentName = attachment ? String(body.attachmentName || "Order screenshot.png").slice(0, 180) : null;
    await ensureWorkspace();
    const result = await db.transaction(async (tx) => {
      const [created] = await tx.insert(pickRequests).values({ orderNumber, customer, message: message || "Can you pick this order and bring it to the counter?", createdBy, priority: body.priority === "urgent" ? "urgent" : "normal", attachment, attachmentName }).returning();
      await tx.insert(requestEvents).values({ requestId: created.id, orderNumber, actor: createdBy, action: "created" });
      return created;
    });
    return Response.json({ ...result, attachment: result.attachment?.startsWith("data:") ? `/api/requests/${result.id}/attachment` : result.attachment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create request", error);
    return Response.json({ error: "Could not send your request. Please try again." }, { status: 500 });
  }
}
