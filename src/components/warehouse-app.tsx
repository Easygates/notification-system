"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Maximize, Minimize, Volume2, VolumeX, SlidersHorizontal, Check, Package, Flag, Clock3, ImageIcon, ArrowUpRight, Radio, ArrowRight, CheckCheck, Monitor } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { Logo, StatusBadge, relativeTime, ImageViewer, Toast, Spinner, Avatar } from "@/components/shared";
import { SettingsDialog } from "@/components/dialogs";
import { unlockAudio, playAlert } from "@/lib/audio";
import type { DashboardData, PickRequest, RequestStatus } from "@/lib/types";

export function WarehouseApp({ initialData }: { initialData: DashboardData }) {
  const { data, connected, updateStatus, saveSettings } = useWorkspace(initialData);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);
  const [actor, setActor] = useState("Alex Morgan");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [image, setImage] = useState<{ src: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const notify = useCallback((message: string, error = false) => setToast({ message, error }), []);
  const active = data.requests.filter((request) => request.status !== "completed").sort((a, b) => a.priority !== b.priority ? a.priority === "urgent" ? -1 : 1 : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const signature = active.map((request) => request.id).sort().join(",");
  const urgent = active.filter((request) => request.priority === "urgent").length;
  const { soundEnabled, repeatSeconds, durationSeconds, volume, tone } = data.settings;

  useEffect(() => {
    setClock(new Date());
    const interval = setInterval(() => setClock(new Date()), 1000);
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    const savedActor = localStorage.getItem("counterline-warehouse-actor");
    if (["Alex Morgan", "Sam Taylor", "Jamie Davis"].includes(savedActor || "")) setActor(savedActor!);
    return () => { clearInterval(interval); document.removeEventListener("fullscreenchange", onFullscreen); };
  }, []);

  useEffect(() => {
    if (!audioEnabled || !soundEnabled || !signature) return;
    const startedAt = Date.now();
    const alert = () => {
      if (durationSeconds && Date.now() - startedAt >= durationSeconds * 1000) return;
      playAlert({ tone, volume });
    };
    alert();
    const interval = window.setInterval(alert, repeatSeconds * 1000);
    return () => window.clearInterval(interval);
  }, [audioEnabled, signature, soundEnabled, repeatSeconds, durationSeconds, volume, tone]);

  async function toggleSound() {
    if (audioEnabled && soundEnabled) { setAudioEnabled(false); return; }
    try {
      await unlockAudio();
      if (!soundEnabled) await saveSettings({ ...data.settings, soundEnabled: true });
      setAudioEnabled(true);
      notify("Sound enabled. We'll keep you in the loop.");
    } catch (error) { notify(error instanceof Error ? error.message : "Could not enable audio. Please try again.", true); }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else notify("Fullscreen isn't available here. Use your browser's fullscreen mode.", true);
    } catch { notify("Use your browser's fullscreen shortcut (F11) to expand the display.", true); }
  }

  async function changeStatus(request: PickRequest, status: RequestStatus) {
    setBusyId(request.id);
    try { await updateStatus(request.id, status, actor); notify(status === "completed" ? `Order #${request.orderNumber} completed. One more happy customer.` : `You're picking order #${request.orderNumber}.`); }
    catch (error) { notify(error instanceof Error ? error.message : "Unable to update this order.", true); }
    finally { setBusyId(null); }
  }

  return <div className="warehouse-shell">
    <header className="warehouse-header"><div className="warehouse-brand"><Logo light /><span className="warehouse-brand-divider" /><span className="display-label"><Monitor size={16} />Warehouse display</span></div><div className="warehouse-header-actions"><button className={`display-button ${audioEnabled && soundEnabled ? "display-sound-active" : ""}`} onClick={() => void toggleSound()}>{audioEnabled && soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}<span>{audioEnabled && soundEnabled ? "Sound on" : "Enable sound"}</span>{audioEnabled && soundEnabled && <span className="sound-wave-dot" />}</button><button className="display-icon-button" onClick={() => setSettingsOpen(true)} aria-label="Display alert settings" title="Alert settings"><SlidersHorizontal size={18} /></button><button className="display-icon-button" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}>{fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}</button><a className="display-return" href="/"><ArrowLeft size={16} /><span>Back to workspace</span></a></div></header>
    <main className="warehouse-main"><div className="warehouse-heading"><div><div className="warehouse-eyebrow"><span />MAIN BRANCH · LIVE ORDER BOARD</div><h1>Let’s get these moving<span>.</span></h1><p>A good handoff makes everyone’s day.</p></div><div className="warehouse-clock"><strong>{clock ? clock.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—:—"}</strong><span>{clock ? clock.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "Warehouse display"}</span></div></div>
      <div className="warehouse-board-toolbar"><div className="warehouse-counts"><span><Package size={17} /><strong>{active.length}</strong> active {active.length === 1 ? "request" : "requests"}</span><span className="warehouse-picking-count"><span />{active.filter((request) => request.status === "picking").length} being picked</span>{urgent > 0 && <span className="warehouse-urgent-count"><Flag size={13} />{urgent} urgent</span>}</div><label className="warehouse-operator">Working as<select aria-label="Warehouse operator" value={actor} onChange={(event) => { setActor(event.target.value); localStorage.setItem("counterline-warehouse-actor", event.target.value); }}><option>Alex Morgan</option><option>Sam Taylor</option><option>Jamie Davis</option></select></label></div>
      {!audioEnabled && active.length > 0 && soundEnabled && <div className="audio-reminder"><Volume2 size={16} /><span>A little heads-up: enable sound to hear incoming order alerts.</span><button onClick={() => void toggleSound()}>Enable sound<ArrowRight size={14} /></button></div>}
      {active.length > 0 ? <div className="warehouse-grid">{active.map((request) => <article key={request.id} className={`warehouse-card ${request.priority === "urgent" ? "warehouse-card-urgent" : ""}`}><div className="warehouse-card-top"><span className="warehouse-order-number"><span>ORDER</span>#{request.orderNumber}</span><div><StatusBadge status={request.status} /><span className="warehouse-order-age" suppressHydrationWarning><Clock3 size={13} />{relativeTime(request.createdAt)}</span></div></div><div className="warehouse-card-customer"><h2>{request.customer || "Trade counter order"}</h2>{request.priority === "urgent" && <span className="urgent-label"><Flag size={12} fill="currentColor" />Urgent</span>}</div><p className="warehouse-card-message">{request.message}</p><div className="warehouse-note-area">{request.attachment ? <button className="warehouse-attachment" onClick={() => setImage({ src: request.attachment!, name: request.attachmentName || "Order screenshot" })}><img src={request.attachment} alt="Visual note thumbnail" /><span><strong><ImageIcon size={13} />Visual note attached</strong><small>Tap to see order details</small></span><ArrowUpRight size={16} /></button> : <div className="warehouse-sent-by"><Avatar name={request.createdBy} size="xs" /><span>Sent by {request.createdBy}</span></div>}</div><div className="warehouse-card-actions">{request.status === "pending" && <button className="warehouse-start" disabled={busyId === request.id} onClick={() => void changeStatus(request, "picking")} title="Start picking this order"><Package size={18} />Start picking</button>}<button className="warehouse-complete" disabled={busyId === request.id} onClick={() => void changeStatus(request, "completed")}>{busyId === request.id ? <Spinner /> : <Check size={19} />}Mark complete</button></div>{request.status === "picking" && <div className="warehouse-picker"><span />{request.pickedBy || "Warehouse team"} is on it</div>}</article>)}</div> : <div className="warehouse-empty"><span><CheckCheck size={55} strokeWidth={1.5} /></span><h2>All clear. Nice work!</h2><p>Every order is out the door. New requests will appear here automatically.</p><div><Radio size={17} />Listening for the next handoff</div></div>}
    </main>
    <footer className="warehouse-footer"><span className={connected ? "" : "warehouse-disconnected"}><span />{connected ? "Connected · Updates every 4 seconds" : "Connection interrupted · Reconnecting…"}</span><span>{audioEnabled && soundEnabled ? <><Volume2 size={13} />Alerts every {repeatSeconds}s{durationSeconds ? ` · for ${durationSeconds / 60 >= 1 ? `${durationSeconds / 60} min` : `${durationSeconds}s`}` : " · until completed"}</> : <><VolumeX size={13} />Sound is off on this display</>}</span><span>From counter to warehouse. Together.</span></footer>
    {settingsOpen && <SettingsDialog settings={data.settings} onClose={() => setSettingsOpen(false)} onSave={async (settings) => { await saveSettings(settings); notify("Display preferences saved."); }} />}
    {image && <ImageViewer src={image.src} name={image.name} onClose={() => setImage(null)} />}
    {toast && <Toast message={toast.message} error={toast.error} onClose={dismissToast} />}
  </div>;
}
