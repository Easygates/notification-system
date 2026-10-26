"use client";

import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { ImagePlus, X, ArrowUpRight, Flag, Radio, ImageIcon, Clipboard, Paperclip } from "lucide-react";
import { Modal, Avatar, Spinner } from "@/components/shared";
import type { NewRequest, Priority } from "@/lib/types";

export function RequestModal({ actor, onClose, onSubmit }: { actor: string; onClose: () => void; onSubmit: (request: NewRequest) => Promise<void> }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const readFile = useCallback((file: File) => {
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) { setError("Please choose a PNG, JPG, WebP, or GIF image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Your screenshot must be smaller than 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setAttachment(reader.result as string); setAttachmentName(file.name === "image.png" ? "Order screenshot.png" : file.name); setError(""); };
    reader.onerror = () => setError("Could not read this image. Please choose it again.");
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items || []).find((entry) => entry.type.startsWith("image/"));
      if (item) { const file = item.getAsFile(); if (file) { event.preventDefault(); readFile(file); } }
    };
    document.addEventListener("paste", paste);
    return () => document.removeEventListener("paste", paste);
  }, [readFile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!orderNumber.trim()) { setError("Please enter an order number."); return; }
    setBusy(true); setError("");
    try { await onSubmit({ orderNumber, customer, message, priority, attachment, attachmentName, createdBy: actor }); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not send your request."); setBusy(false); }
  }

  return <Modal title="New pick request" subtitle="A quick handoff. We'll take it from here." onClose={() => { if (!busy) onClose(); }} className="request-modal">
    <form onSubmit={submit}>
      <div className="modal-body">
        <div className="form-row"><label className="form-field">Order number <span className="required">*</span><div className="input-prefix"><span>#</span><input data-autofocus value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="e.g. 12409" maxLength={40} required autoComplete="off" /></div></label><label className="form-field">Customer <span className="optional">(optional)</span><input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Customer or company name" maxLength={120} /></label></div>
        <label className="form-field">Message <span className="optional">(optional)</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Can you pick this order? The customer is waiting at the counter." maxLength={1500} rows={3} /></label>
        <div className="priority-field"><div><span className="field-label">Priority</span><p>Need this one a little sooner?</p></div><button type="button" className={`priority-toggle ${priority === "urgent" ? "selected" : ""}`} onClick={() => setPriority(priority === "urgent" ? "normal" : "urgent")} aria-pressed={priority === "urgent"}><Flag size={14} />Mark as urgent</button></div>
        <div className="attachment-label"><span className="field-label">Visual note <span className="optional">(optional)</span></span><Paperclip size={14} /></div>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) readFile(file); }} aria-label="Upload an order screenshot" />
        {attachment ? <div className="attachment-preview"><img src={attachment} alt="Attached order screenshot preview" /><div><strong><ImageIcon size={14} />{attachmentName}</strong><span>Visual note ready to send</span></div><button className="icon-button" type="button" onClick={() => { setAttachment(null); setAttachmentName(null); if (fileInput.current) fileInput.current.value = ""; }} aria-label="Remove attachment"><X size={17} /></button></div> : <div className={`upload-zone ${dragging ? "dragging" : ""}`} role="button" tabIndex={0} onClick={() => fileInput.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.current?.click(); } }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) readFile(file); }}><span className="upload-icon"><ImagePlus size={23} strokeWidth={1.5} /></span><strong>Drop a screenshot, or <span>click to browse</span></strong><span>PNG, JPG, WebP or GIF · up to 5 MB</span></div>}
        <div className="clipboard-hint"><Clipboard size={15} /><span>Snip with <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>, then <kbd>Ctrl</kbd> + <kbd>V</kbd> here.</span></div>
        <div className="sender-row"><Avatar name={actor} size="xs" /><span>Sending as <strong>{actor}</strong></span></div>
        {error && <div className="form-error" role="alert">{error}</div>}
      </div>
      <div className="modal-footer"><span className="form-visibility"><Radio size={14} />Shared with your warehouse</span><div className="button-group"><button type="button" className="button button-secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? <Spinner /> : <ArrowUpRight size={17} />}{busy ? "Sending…" : "Send request"}</button></div></div>
    </form>
  </Modal>;
}
