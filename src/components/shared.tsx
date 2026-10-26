"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, Check, AlertCircle, Package, LoaderCircle } from "lucide-react";
import type { RequestStatus } from "@/lib/types";

export function Logo({ light = false }: { light?: boolean }) {
  return <div className={`brand ${light ? "brand-light" : ""}`} aria-label="Counterline">
    <svg width="33" height="35" viewBox="0 0 33 35" fill="none" aria-hidden="true"><path d="M3 9.5 16.5 2 30 9.5 16.5 17 3 9.5Z" fill="#e26d40"/><path d="m3 16.5 13.5 7.5L30 16.5v7L16.5 31 3 23.5v-7Z" fill="#e26d40"/><path d="m3 9.5 13.5 7.5v7L3 16.5v-7Z" fill="#f4a17c"/><path d="m30 9.5-13.5 7.5v7L30 16.5v-7Z" fill="#c9562d"/></svg>
    <span>counterline<span className="brand-period">.</span></span>
  </div>;
}

export function Avatar({ name, size = "sm" }: { name: string; size?: "xs" | "sm" | "md" }) {
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  const color = name === "Alex Morgan" ? "blue" : name === "Sam Taylor" ? "purple" : "peach";
  return <span className={`avatar avatar-${size} avatar-${color}`} title={name}>{initials}</span>;
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`status-badge status-${status}`}><span className="status-dot" />{status === "pending" ? "Pending" : status === "picking" ? "Picking" : "Completed"}</span>;
}

export function shortName(name: string) {
  const parts = name.split(" ");
  return `${parts[0]}${parts[1] ? ` ${parts[1][0]}.` : ""}`;
}

export function relativeTime(date: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function Modal({ title, subtitle, children, onClose, wide = false, className = "" }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      const first = ref.current?.querySelector<HTMLElement>("[data-autofocus]") || ref.current?.querySelector<HTMLElement>("input, textarea, select, button");
      first?.focus();
    });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab" && ref.current) {
        const elements = Array.from(ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea, select, [tabindex="0"]')).filter((element) => element.getClientRects().length);
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", keydown); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} className={`modal ${wide ? "modal-wide" : ""} ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="modal-heading"><div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div>
      {children}
    </div>
  </div>;
}

export function ImageViewer({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  return <Modal title="Visual note" subtitle={name} onClose={onClose} wide className="image-modal"><div className="image-viewer"><img src={src} alt={name || "Order screenshot"} /></div><div className="modal-footer"><span className="muted">Attached to this request for the whole team.</span><button className="button button-secondary" onClick={onClose}>Done</button></div></Modal>;
}

export function Toast({ message, error = false, onClose }: { message: string; error?: boolean; onClose: () => void }) {
  useEffect(() => { const timeout = setTimeout(onClose, 4500); return () => clearTimeout(timeout); }, [message, onClose]);
  return <div className={`toast ${error ? "toast-error" : ""}`} role={error ? "alert" : "status"}><span className="toast-icon">{error ? <AlertCircle size={18} /> : <Check size={18} />}</span><span>{message}</span><button className="icon-button" onClick={onClose} aria-label="Dismiss notification"><X size={16} /></button></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Package size={30} strokeWidth={1.5} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Spinner() { return <LoaderCircle className="spin" size={16} />; }
