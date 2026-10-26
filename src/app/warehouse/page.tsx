import { getDashboardData } from "@/lib/workspace";
import { WarehouseApp } from "@/components/warehouse-app";

export const dynamic = "force-dynamic";

export const metadata = { title: "Warehouse display — Counterline" };

export default async function WarehousePage() {
  return <WarehouseApp initialData={await getDashboardData()} />;
}
