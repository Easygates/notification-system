export type RequestStatus = "pending" | "picking" | "completed";
export type Priority = "normal" | "urgent";

export interface PickRequest {
  id: string;
  orderNumber: string;
  customer: string;
  message: string;
  priority: Priority;
  status: RequestStatus;
  attachment: string | null;
  attachmentName: string | null;
  createdBy: string;
  pickedBy: string | null;
  completedBy: string | null;
  createdAt: string;
  pickedAt: string | null;
  completedAt: string | null;
}

export interface ActivityEvent {
  id: string;
  requestId: string;
  orderNumber: string;
  actor: string;
  action: "created" | "picking" | "completed" | "reopened";
  createdAt: string;
}

export interface AlertSettings {
  id: number;
  soundEnabled: boolean;
  tone: "chime" | "bell" | "beep";
  repeatSeconds: number;
  durationSeconds: number;
  volume: number;
}

export interface DashboardData {
  requests: PickRequest[];
  activity: ActivityEvent[];
  settings: AlertSettings;
}

export interface NewRequest {
  orderNumber: string;
  customer: string;
  message: string;
  priority: Priority;
  attachment: string | null;
  attachmentName: string | null;
  createdBy: string;
}

export const TEAM = [
  { name: "Jamie Davis", initials: "JD", role: "Shopfront", color: "peach" },
  { name: "Alex Morgan", initials: "AM", role: "Warehouse", color: "blue" },
  { name: "Sam Taylor", initials: "ST", role: "Warehouse", color: "purple" },
] as const;
