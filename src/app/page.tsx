import { getDashboardData } from "@/lib/workspace";
import { WorkspaceApp } from "@/components/workspace-app";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getDashboardData();
  return <WorkspaceApp initialData={data} />;
}
