import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Counterline — A smoother handoff",
  description: "Keep your trade counter and warehouse in sync. Send pick requests, share visual notes, and keep every order moving.",
  applicationName: "Counterline",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
