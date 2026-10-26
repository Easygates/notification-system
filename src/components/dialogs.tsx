"use client";

import { useState } from "react";
import { Volume2, BellRing, Check, Radio, Monitor, ImagePlus, ClipboardCheck, Send, ExternalLink, RotateCcw, ImageIcon, PackageCheck, ArrowRight } from "lucide-react";
import { Modal, Spinner, StatusBadge, Avatar } from "@/components/shared";
import { unlockAudio, playAlert } from "@/lib/audio";
import type { AlertSettings, PickRequest, RequestStatus } from "@/lib/types";

export function SettingsDialog({ settings, onClose, onSave }: { settings: AlertSettings; onClose: () => void; onSave: (settings: AlertSettings) => Promise<void> }) {
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function testSound() {
    try { await unlockAudio(); playAlert(form); setError(""); }
    catch (error) { setError(error instanceof Error ? error.message : "Audio is unavailable in this browser."); }
  }
  async function save() {
    setBusy(true); setError("");
    try { await onSave(form); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not save your preferences."); setBusy(false); }
  }
  return <Modal title="Alert settings" subtitle="Give every request the attention it deserves." onClose={() => { if (!busy) onClose(); }}>
    <div className="modal-body settings-body">
      <div className="settings-notice"><span><Monitor size={21} /></span><p>These settings apply to your <strong>warehouse display</strong>. Enable sound on that screen once to allow browser audio.</p></div>
      <div className="setting-toggle-row"><span className="setting-icon"><BellRing size={20} /></span><div><strong>Sound alerts</strong><p>Play an alert while orders are waiting.</p></div><button type="button" className={`switch ${form.soundEnabled ? "switch-on" : ""}`} role="switch" aria-checked={form.soundEnabled} aria-label="Enable sound alerts" onClick={() => setForm({ ...form, soundEnabled: !form.soundEnabled })}><span /></button></div>
      <div className="form-row"><label className="form-field">Alert sound<select aria-label="Alert sound" value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value as AlertSettings["tone"] })}><option value="chime">Gentle chime</option><option value="bell">Counter bell</option><option value="beep">Classic beep</option></select></label><label className="form-field">Repeat every<select aria-label="Repeat every" value={form.repeatSeconds} onChange={(event) => setForm({ ...form, repeatSeconds: Number(event.target.value) })}>{[5, 10, 15, 30, 60].map((value) => <option key={value} value={value}>{value} seconds</option>)}</select></label></div>
      <label className="form-field">Keep alerting for<select aria-label="Keep alerting for" value={form.durationSeconds} onChange={(event) => setForm({ ...form, durationSeconds: Number(event.target.value) })}><option value={0}>Until all requests are completed</option><option value={30}>30 seconds</option><option value={60}>1 minute</option><option value={120}>2 minutes</option><option value={300}>5 minutes</option></select><span className="field-hint">Alerts stop when all active requests are completed.</span></label>
      <label className="form-field volume-field"><span>Volume <strong>{form.volume}%</strong></span><input aria-label="Alert volume" type="range" min="0" max="100" step="5" value={form.volume} onChange={(event) => setForm({ ...form, volume: Number(event.target.value) })} /></label>
      <button className="button button-secondary test-sound" type="button" onClick={testSound}><Volume2 size={16} />Test sound</button>
      {error && <div className="form-error" role="alert">{error}</div>}
    </div>
    <div className="modal-footer"><span className="muted"><Radio size={14} />Saved for the whole workspace</span><div className="button-group"><button className="button button-secondary" disabled={busy} onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy} onClick={save}>{busy ? <Spinner /> : <Check size={16} />}Save settings</button></div></div>
  </Modal>;
}

export function HelpDialog({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: Send, title: "Send it from the counter", text: "Hit New request, enter the order number, and add a quick message. Mark it urgent if the customer is waiting." },
    { icon: ImagePlus, title: "A screenshot says it all", text: "Press Win + Shift + S to capture your order screen, then Ctrl + V in the new request dialog. You can also upload or drop an image." },
    { icon: Monitor, title: "Put the warehouse in the picture", text: "Open Warehouse display on your signage screen. Click Enable sound once, and use fullscreen for an easy-to-read order board. Requests sync every 4 seconds." },
    { icon: ClipboardCheck, title: "Pick, complete, repeat", text: "Either the shopfront or warehouse can start picking or complete a request. Everyone sees the change, and completed orders stay in your history." },
  ];
  return <Modal title="A better handoff starts here." subtitle="Your quick guide to Counterline." onClose={onClose}><div className="modal-body help-body">{steps.map((step, index) => <div className="help-step" key={step.title}><span className="help-step-icon"><step.icon size={20} /></span><div><span className="help-step-number">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></div></div>)}<div className="settings-notice"><BellRing size={20} /><p>Make it your own: choose an alert sound, repeat interval, and duration in <strong>Alert settings</strong>.</p></div></div><div className="modal-footer"><span className="muted">Less chasing. More doing.</span><button className="button button-primary" onClick={onClose}>Got it<ArrowRight size={16} /></button></div></Modal>;
}

export function DetailsDialog({ request, onClose, onStatus, onPreview }: { request: PickRequest; onClose: () => void; onStatus: (request: PickRequest, status: RequestStatus) => Promise<boolean>; onPreview: (src: string, name: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function changeStatus(status: RequestStatus) { setBusy(true); if (await onStatus(request, status)) onClose(); else setBusy(false); }
  return <Modal title={`Order #${request.orderNumber}`} subtitle={request.customer || "Trade counter request"} onClose={() => { if (!busy) onClose(); }}><div className="modal-body details-body"><div className="details-status"><StatusBadge status={request.status} />{request.priority === "urgent" && <span className="urgent-label"><span />High priority</span>}</div><p className="details-message">{request.message}</p>{request.attachment && <button className="details-attachment" onClick={() => onPreview(request.attachment!, request.attachmentName || "Order screenshot")}><img src={request.attachment} alt="Order visual note" /><span><ImageIcon size={15} />{request.attachmentName || "Order screenshot"}<ExternalLink size={14} /></span></button>}<div className="details-info"><div><span>Requested by</span><strong><Avatar name={request.createdBy} size="xs" />{request.createdBy}</strong></div><div><span>Sent</span><strong>{new Date(request.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</strong></div>{request.pickedBy && <div><span>Picking by</span><strong>{request.pickedBy}</strong></div>}{request.completedBy && <div><span>Completed by</span><strong>{request.completedBy}</strong></div>}</div></div><div className="modal-footer"><button className="button button-secondary" onClick={onClose} disabled={busy}>Close</button><div className="button-group">{request.status === "completed" ? <button className="button button-secondary" onClick={() => changeStatus("pending")} disabled={busy}>{busy ? <Spinner /> : <RotateCcw size={16} />}Reopen request</button> : <>{request.status === "pending" && <button className="button button-secondary" disabled={busy} onClick={() => changeStatus("picking")}>Start picking</button>}<button className="button button-primary" disabled={busy} onClick={() => changeStatus("completed")}>{busy ? <Spinner /> : <PackageCheck size={17} />}Mark complete</button></>}</div></div></Modal>;
}
