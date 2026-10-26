import { db } from "@/db";
import { pickRequests, requestEvents, workspaceSettings } from "@/db/schema";
import { desc, sql, getTableColumns } from "drizzle-orm";
import type { DashboardData } from "@/lib/types";

let seedPromise: Promise<void> | undefined;

export function ensureWorkspace() {
  if (!seedPromise) {
    seedPromise = seedWorkspace().catch((error) => {
      seedPromise = undefined;
      throw error;
    });
  }
  return seedPromise;
}

async function seedWorkspace() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(817302)`);
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS "pick_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "order_number" varchar(40) NOT NULL,
        "customer" varchar(120) DEFAULT '' NOT NULL,
        "message" text NOT NULL,
        "priority" varchar(12) DEFAULT 'normal' NOT NULL,
        "status" varchar(16) DEFAULT 'pending' NOT NULL,
        "attachment" text,
        "attachment_name" varchar(180),
        "created_by" varchar(80) NOT NULL,
        "picked_by" varchar(80),
        "completed_by" varchar(80),
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "picked_at" timestamp with time zone,
        "completed_at" timestamp with time zone
      )
    `);
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS "request_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "request_id" uuid NOT NULL REFERENCES "pick_requests"("id") ON DELETE CASCADE,
        "order_number" varchar(40) NOT NULL,
        "actor" varchar(80) NOT NULL,
        "action" varchar(24) NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS "workspace_settings" (
        "id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
        "sound_enabled" boolean DEFAULT true NOT NULL,
        "tone" varchar(16) DEFAULT 'chime' NOT NULL,
        "repeat_seconds" integer DEFAULT 15 NOT NULL,
        "duration_seconds" integer DEFAULT 0 NOT NULL,
        "volume" integer DEFAULT 65 NOT NULL
      )
    `);
    await tx.insert(workspaceSettings).values({ id: 1 }).onConflictDoNothing();
    const existing = await tx.select({ id: pickRequests.id }).from(pickRequests).limit(1);
    if (existing.length) return;
    const now = Date.now();
    const active = [
      { orderNumber: "12408", customer: "Harrison Building Co.", message: "Customer is at the counter. Please pick and bring to collection.", priority: "urgent", status: "pending", createdBy: "Jamie Davis", minutes: 2, attachment: "/images/order-note.svg", attachmentName: "Order details.png" },
      { orderNumber: "12407", customer: "Oakwood Electrical", message: "2 × cable drums and 4 × twin sockets. Thank you!", priority: "normal", status: "picking", createdBy: "Jamie Davis", pickedBy: "Alex Morgan", minutes: 5 },
      { orderNumber: "12406", customer: "Mitchell & Sons", message: "Can you pick this order? Customer will be here in 10 minutes.", priority: "normal", status: "pending", createdBy: "Jamie Davis", minutes: 8 },
      { orderNumber: "12405", customer: "Westbrook Plumbing", message: "Please check the 22mm fittings against the attached order.", priority: "normal", status: "picking", createdBy: "Sam Taylor", pickedBy: "Sam Taylor", minutes: 11, attachment: "/images/order-note.svg", attachmentName: "Order screenshot.png" },
      { orderNumber: "12404", customer: "Walk-in customer", message: "One bag of rapid-set cement and 3 × timber posts, please.", priority: "normal", status: "pending", createdBy: "Jamie Davis", minutes: 14 },
      { orderNumber: "12403", customer: "Greenfield Projects", message: "Order is paid and ready to go. Please bring to collection bay.", priority: "normal", status: "pending", createdBy: "Jamie Davis", minutes: 18 },
    ];
    for (const item of active) {
      const { minutes, ...fields } = item;
      const createdAt = new Date(now - minutes * 60_000);
      const [request] = await tx.insert(pickRequests).values({ ...fields, createdAt, pickedAt: item.status === "picking" ? new Date(now - (minutes - 2) * 60_000) : null }).returning();
      await tx.insert(requestEvents).values({ requestId: request.id, orderNumber: request.orderNumber, actor: request.createdBy, action: "created", createdAt });
      if (item.status === "picking") await tx.insert(requestEvents).values({ requestId: request.id, orderNumber: request.orderNumber, actor: item.pickedBy!, action: "picking", createdAt: request.pickedAt! });
    }
    const customers = ["Atlas Construction", "Lakeside Renovations", "Oakwood Electrical", "Mitchell & Sons", "Westbrook Plumbing", "Greenfield Projects"];
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    for (let i = 0; i < 18; i++) {
      const completedAt = new Date(now - Math.min((i + 1) * 7 * 60_000, Math.max(0, now - midnight.getTime() - 1000)));
      const createdAt = new Date(completedAt.getTime() - (222 + (i % 5) * 15) * 1000);
      const actor = i % 2 ? "Alex Morgan" : "Sam Taylor";
      const [request] = await tx.insert(pickRequests).values({ orderNumber: String(12402 - i), customer: customers[i % customers.length], message: "Please pick this order and bring it to the collection counter. Thanks!", status: "completed", createdBy: "Jamie Davis", pickedBy: actor, completedBy: actor, createdAt, pickedAt: new Date(createdAt.getTime() + 60_000), completedAt }).returning();
      await tx.insert(requestEvents).values({ requestId: request.id, orderNumber: request.orderNumber, actor, action: "completed", createdAt: completedAt });
    }
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  await ensureWorkspace();
  const { attachment, ...columns } = getTableColumns(pickRequests);
  const [requests, activity, settings] = await Promise.all([
    db.select({ ...columns, attachment: sql<string | null>`case when ${attachment} like 'data:%' then '/api/requests/' || ${pickRequests.id}::text || '/attachment' else ${attachment} end` }).from(pickRequests).orderBy(desc(pickRequests.createdAt)).limit(500),
    db.select().from(requestEvents).orderBy(desc(requestEvents.createdAt)).limit(100),
    db.select().from(workspaceSettings).limit(1),
  ]);
  return JSON.parse(JSON.stringify({ requests, activity, settings: settings[0] })) as DashboardData;
}
