"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LayoutGrid, CircleCheck, History, Monitor, SlidersHorizontal, CircleHelp, ChevronRight, ChevronsUpDown, Store, Plus, ArrowUpRight, ArrowRight, Search, List, ChevronDown, MoreHorizontal, Package, PackageCheck, Clock3, TrendingUp, Timer, Inbox, Radio, Bell, PanelLeft, X, Check, Flag, MapPin, Paperclip, RefreshCw, ExternalLink, Users, CheckCheck } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { Logo, Avatar, StatusBadge, shortName, relativeTime, ImageViewer, Toast, EmptyState, Spinner } from "@/components/shared";
import { RequestModal } from "@/components/request-modal";
import { SettingsDialog, HelpDialog, DetailsDialog } from "@/components/dialogs";
import { TEAM, type DashboardData, type PickRequest, type RequestStatus, type NewRequest } from "@/lib/types";

type Section = "requests" | "completed" | "activity";
type Tab = "all" | RequestStatus;

export function WorkspaceApp({ initialData }: { initialData: DashboardData }) {
  const { data, connected, refresh, updateStatus, createRequest, saveSettings } = useWorkspace(initialData);
  const [section, setSection] = useState<Section>("requests");
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("newest");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [actor, setActor] = useState("Jamie Davis");
  const [compose, setCompose] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [image, setImage] = useState<{ src: string; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const notify = useCallback((message: string, error = false) => setToast({ message, error }), []);

  useEffect(() => {
    const savedActor = localStorage.getItem("counterline-actor");
    if (TEAM.some((member) => member.name === savedActor)) setActor(savedActor!);
    const savedLayout = localStorage.getItem("counterline-layout");
    if (savedLayout === "list") setLayout("list");
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key.toLowerCase() === "n" && !event.ctrlKey && !event.metaKey && !event.altKey && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && !document.querySelector('[role="dialog"]')) { event.preventDefault(); setCompose(true); }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);

  const active = data.requests.filter((item) => item.status !== "completed");
  const pending = active.filter((item) => item.status === "pending");
  const picking = active.filter((item) => item.status === "picking");
  const completed = data.requests.filter((item) => item.status === "completed");
  const today = new Date().toDateString();
  const completedToday = completed.filter((item) => item.completedAt && new Date(item.completedAt).toDateString() === today);
  const average = completedToday.length ? Math.round(completedToday.reduce((sum, item) => sum + (new Date(item.completedAt!).getTime() - new Date(item.createdAt).getTime()) / 1000, 0) / completedToday.length) : 0;
  const detailsRequest = data.requests.find((item) => item.id === detailsId);
  const title = section === "activity" ? "Activity log" : section === "completed" ? "Completed requests" : "Live requests";

  const filtered = useMemo(() => data.requests.filter((item) => {
    const statusMatches = tab === "all" ? item.status !== "completed" : item.status === tab;
    return statusMatches && (priority === "all" || item.priority === priority) && `${item.orderNumber} ${item.customer} ${item.message} ${item.createdBy}`.toLowerCase().includes(query.toLowerCase().trim());
  }).sort((a, b) => {
    if (sort === "priority" && a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
    const aDate = tab === "completed" ? a.completedAt || a.createdAt : a.createdAt;
    const bDate = tab === "completed" ? b.completedAt || b.createdAt : b.createdAt;
    return sort === "oldest" ? new Date(aDate).getTime() - new Date(bDate).getTime() : new Date(bDate).getTime() - new Date(aDate).getTime();
  }), [data.requests, tab, priority, query, sort]);

  function navigate(next: Section) {
    setSection(next); setTab(next === "completed" ? "completed" : "all"); setQuery(""); setPriority("all"); setMobileNav(false); setFiltersOpen(false);
  }
  function selectTab(next: Tab) { setTab(next); setSection(next === "completed" ? "completed" : "requests"); }
  function switchActor(name: string) { setActor(name); localStorage.setItem("counterline-actor", name); setProfileOpen(false); notify(`You're now sending as ${name}.`); }
  function changeLayout(next: "grid" | "list") { setLayout(next); localStorage.setItem("counterline-layout", next); }
  function preview(src: string, name: string) { setDetailsId(null); setImage({ src, name }); }

  async function handleStatus(request: PickRequest, status: RequestStatus) {
    if (busyId === request.id) return false;
    setBusyId(request.id);
    try {
      await updateStatus(request.id, status, actor);
      notify(status === "completed" ? `Order #${request.orderNumber} completed. Nice teamwork!` : status === "picking" ? `You're picking order #${request.orderNumber}.` : `Order #${request.orderNumber} is back on the board.`);
      return true;
    } catch (error) { notify(error instanceof Error ? error.message : "Something went wrong.", true); return false; }
    finally { setBusyId(null); }
  }

  async function handleCreate(request: NewRequest) {
    await createRequest(request);
    setCompose(false); navigate("requests");
    notify(`Order #${request.orderNumber.replace(/^#/, "")} sent to the warehouse.`);
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All requests", count: active.length },
    { key: "pending", label: "Pending", count: pending.length },
    { key: "picking", label: "Picking", count: picking.length },
    { key: "completed", label: "Completed", count: completed.length },
  ];

  return <div className="app-shell">
    {mobileNav && <div className="sidebar-scrim" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Logo /><button className="icon-button mobile-nav-close" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={20} /></button></div>
      <div className="workspace-picker-wrap"><button className="workspace-picker" onClick={() => setWorkspaceOpen(!workspaceOpen)} aria-expanded={workspaceOpen}><span className="workspace-icon"><Store size={19} strokeWidth={1.6} /></span><span><strong>Main branch</strong><small>Counter & warehouse</small></span><ChevronsUpDown size={15} /></button>{workspaceOpen && <div className="popover workspace-menu"><span className="popover-label">YOUR WORKSPACE</span><button onClick={() => setWorkspaceOpen(false)}><Store size={16} /><span>Shopfront<small>Send & manage requests</small></span><Check size={15} /></button><a href="/warehouse" target="_blank" rel="noreferrer"><Monitor size={16} /><span>Warehouse display<small>Open the live order board</small></span><ArrowUpRight size={15} /></a></div>}</div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Workspace navigation">
        <button className={`nav-item ${section === "requests" ? "nav-active" : ""}`} onClick={() => navigate("requests")}><LayoutGrid size={18} /><span>Live requests</span><span className="nav-count">{active.length}</span></button>
        <button className={`nav-item ${section === "completed" ? "nav-active" : ""}`} onClick={() => navigate("completed")}><CircleCheck size={18} /><span>Completed</span></button>
        <button className={`nav-item ${section === "activity" ? "nav-active" : ""}`} onClick={() => navigate("activity")}><History size={18} /><span>Activity log</span></button>
      </nav>
      <div className="nav-label operations-label">OPERATIONS</div>
      <nav className="main-nav" aria-label="Operations navigation"><a className="nav-item" href="/warehouse" target="_blank" rel="noreferrer"><Monitor size={18} /><span>Warehouse display</span><ArrowUpRight size={14} className="nav-external" /></a><button className="nav-item" onClick={() => { setSettingsOpen(true); setMobileNav(false); }}><SlidersHorizontal size={18} /><span>Alert settings</span></button></nav>
      <div className="sidebar-bottom">
        <div className="sidebar-promo"><svg viewBox="0 0 172 78" fill="none" aria-hidden="true"><path d="M28 64V28l51-20 51 20v36H28Z" fill="#fff9f4" stroke="#dca382" strokeWidth="1.4" strokeLinejoin="round"/><path d="M24 29 79 7l55 22M42 34h73M42 42h73M42 50h73M42 58h73" stroke="#dca382" strokeWidth="1.4" strokeLinecap="round"/><path d="M65 36h28v28H65V36Z" fill="#f5c7a9" stroke="#cf8860" strokeWidth="1.4"/><path d="M79 37v26M66 45h26M66 53h26" stroke="#cf8860" strokeWidth="1.2"/><path d="M17 66h137" stroke="#dca382" strokeWidth="1.4" strokeLinecap="round"/><path d="M116 54h19v12h-19V54Z" fill="#fff9f4" stroke="#cf8860" strokeWidth="1.3"/><path d="M124 55v6l3-2 2 2v-6" stroke="#cf8860" strokeWidth="1.1"/><path d="m140 38 3-6m-2 13 7-2M24 47l-6-2" stroke="#e0ad8e" strokeWidth="1.4" strokeLinecap="round"/></svg><h3>Less chasing.<br />More doing.</h3><p>A smoother handoff starts here.</p><button onClick={() => setHelpOpen(true)}>Meet your new workflow<ArrowUpRight size={14} /></button></div>
        <button className="nav-item support-button" onClick={() => setHelpOpen(true)}><CircleHelp size={18} /><span>Help & getting started</span></button>
        <div className="sidebar-profile-wrap">{profileOpen && <div className="popover profile-menu"><span className="popover-label">SENDING REQUESTS AS</span>{TEAM.map((member) => <button key={member.name} onClick={() => switchActor(member.name)}><Avatar name={member.name} /><span>{member.name}<small>{member.role}</small></span>{member.name === actor && <Check size={15} />}</button>)}<p>This is a shared team workspace.</p></div>}<button className="sidebar-profile" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><Avatar name={actor} size="md" /><span><strong>{actor}</strong><small>{TEAM.find((member) => member.name === actor)?.role || "Shopfront"}</small></span><ChevronsUpDown size={15} /></button></div>
      </div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-nav-toggle" onClick={() => setMobileNav(true)} aria-label="Open navigation"><PanelLeft size={20} /></button><span>Workspace</span><ChevronRight size={14} /><strong>{title}</strong></div><div className="topbar-actions"><span className={`connection-status ${connected ? "" : "connection-offline"}`} title="Both screens update automatically every 4 seconds"><span />{connected ? "Live connection" : "Reconnecting…"}</span><span className="topbar-divider" /><button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Alert settings" title="Alert settings"><Bell size={19} /></button><button className="icon-button" onClick={() => setHelpOpen(true)} aria-label="Help and getting started" title="Help & getting started"><CircleHelp size={19} /></button><Avatar name={actor} /></div></header>
      <main className="dashboard">
        <div className="page-heading"><div><div className="heading-title"><h1>{title}</h1>{section === "requests" && <span className="live-pill"><span />LIVE</span>}</div><p>{section === "activity" ? "Every handoff, every update. All in one place." : section === "completed" ? "Another order out the door. That's teamwork." : "A smoother handoff, from counter to warehouse."}</p></div><div className="page-actions"><a href="/warehouse" target="_blank" rel="noreferrer" className="button button-secondary warehouse-link"><Monitor size={16} />Warehouse display<ArrowUpRight size={14} /></a><button className="button button-primary" onClick={() => setCompose(true)}><Plus size={18} />New request<span className="keyboard-shortcut">N</span></button></div></div>
        {!connected && <div className="connection-banner"><Radio size={17} /><span>Connection interrupted. Your requests are safe; we’re trying to reconnect.</span><button onClick={() => void refresh()}><RefreshCw size={14} />Retry</button></div>}
        <section className="metrics-grid" aria-label="Today's workspace summary">
          <div className="metric-card"><div className="metric-label">Active requests<span className="metric-icon metric-orange"><Inbox size={17} /></span></div><div className="metric-value">{active.length}<span className="metric-note"><span className="tiny-orange-dot" />Ready for a handoff</span></div></div>
          <div className="metric-card"><div className="metric-label">Being picked<span className="metric-icon metric-blue"><Package size={17} /></span></div><div className="metric-value">{picking.length}<span className="metric-note">A little teamwork in progress</span></div></div>
          <div className="metric-card"><div className="metric-label">Completed today<span className="metric-icon metric-green"><PackageCheck size={17} /></span></div><div className="metric-value">{completedToday.length}<span className="metric-note metric-note-green"><TrendingUp size={13} />Nice work, team</span></div></div>
          <div className="metric-card"><div className="metric-label">Avg. turnaround<span className="metric-icon metric-purple"><Timer size={17} /></span></div><div className="metric-value metric-time">{average ? <>{Math.floor(average / 60)}<span>m</span> {average % 60}<span>s</span></> : <span className="no-average">—</span>}<span className="metric-note">From request to ready</span></div></div>
        </section>

        {section !== "activity" ? <section className="requests-section" aria-label="Pick requests">
          <div className="board-tabs" role="tablist" aria-label="Request status">{tabs.map((item) => <button key={item.key} role="tab" aria-selected={tab === item.key} className={`board-tab ${tab === item.key ? "tab-active" : ""}`} onClick={() => selectTab(item.key)}>{item.label}<span>{item.count}</span></button>)}<span className="tabs-live-note"><Radio size={13} />Synced across your team</span></div>
          <div className="board-controls"><div className="search-input"><Search size={16} /><input aria-label="Search requests" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order or customer…" />{query && <button className="icon-button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}</div><div className="board-control-actions"><div className="filter-wrap"><button className={`button button-secondary filter-button ${priority !== "all" ? "filter-active" : ""}`} onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}><SlidersHorizontal size={14} />Filters{priority !== "all" && <span className="filter-count">1</span>}</button>{filtersOpen && <div className="popover filter-popover"><div className="filter-heading"><strong>Filter requests</strong><button className="icon-button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={15} /></button></div><span className="field-label">Priority</span>{["all", "urgent", "normal"].map((value) => <button key={value} className={`filter-option ${priority === value ? "filter-selected" : ""}`} onClick={() => { setPriority(value); setFiltersOpen(false); }}>{value === "urgent" ? <Flag size={14} /> : <span className="filter-radio" />}{value === "all" ? "All priorities" : value === "urgent" ? "Urgent only" : "Normal priority"}{priority === value && <Check size={14} />}</button>)}<button className="reset-filter" onClick={() => { setPriority("all"); setQuery(""); setFiltersOpen(false); }}>Reset filters</button></div>}</div><div className="sort-control"><select aria-label="Sort requests" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="priority">Priority first</option></select><ChevronDown size={13} /></div><div className="view-toggle" aria-label="Request layout"><button className={layout === "grid" ? "view-active" : ""} onClick={() => changeLayout("grid")} aria-label="Grid view" aria-pressed={layout === "grid"}><LayoutGrid size={16} /></button><button className={layout === "list" ? "view-active" : ""} onClick={() => changeLayout("list")} aria-label="List view" aria-pressed={layout === "list"}><List size={17} /></button></div></div></div>
          {filtered.length ? <div className={`request-grid ${layout === "list" ? "request-list" : ""}`}>{filtered.map((request) => <RequestCard key={request.id} request={request} busy={busyId === request.id} onStatus={handleStatus} onDetails={() => setDetailsId(request.id)} onPreview={preview} />)}</div> : <EmptyState title={query || priority !== "all" ? "No requests match just yet." : tab === "completed" ? "Good things take a little teamwork." : "All clear. Nice work!"} description={query || priority !== "all" ? "Try a different search or clear your filters to see more requests." : tab === "completed" ? "Your completed requests will appear here." : "New pick requests will appear here. Ready for the next one?"} action={<button className="button button-secondary" onClick={() => { if (query || priority !== "all") { setQuery(""); setPriority("all"); } else setCompose(true); }}>{query || priority !== "all" ? "Clear filters" : "Create a request"}</button>} />}
          <div className="board-footer"><span><span className={`footer-status-dot ${connected ? "" : "offline-dot"}`} />{connected ? "You're in sync. Requests update automatically." : "Waiting for connection…"}</span><span>{filtered.length} {filtered.length === 1 ? "request" : "requests"}{priority === "urgent" ? " · urgent priority" : ""}<span className="footer-divider">/</span>Main branch</span></div>
        </section> : <section className="activity-panel"><div className="activity-panel-header"><div><h2>The latest from your team</h2><p>A shared timeline of orders on the move.</p></div><div className="search-input"><Search size={16} /><input aria-label="Search activity" placeholder="Search order or team member…" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="activity-table-heading"><span>TEAM ACTIVITY</span><span>MOST RECENT FIRST</span></div>{data.activity.filter((event) => `${event.orderNumber} ${event.actor} ${event.action}`.toLowerCase().includes(query.toLowerCase())).map((event) => <button className="activity-row" key={event.id} onClick={() => setDetailsId(event.requestId)}><span className={`activity-event-icon activity-${event.action}`}>{event.action === "completed" ? <CheckCheck size={18} /> : event.action === "picking" ? <Package size={18} /> : event.action === "reopened" ? <RefreshCw size={17} /> : <Plus size={18} />}</span><div><p><strong>{event.actor}</strong> {event.action === "completed" ? "completed a request" : event.action === "picking" ? "started picking an order" : event.action === "reopened" ? "reopened a request" : "sent a new pick request"}</p><span>Order <strong>#{event.orderNumber}</strong><span className="activity-dot">·</span>{new Date(event.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></div><span className="activity-time" suppressHydrationWarning>{relativeTime(event.createdAt)}</span><ChevronRight size={16} /></button>)}{!data.activity.some((event) => `${event.orderNumber} ${event.actor} ${event.action}`.toLowerCase().includes(query.toLowerCase())) && <EmptyState title="No activity found" description="Try searching for a different order or team member." />}</section>}
        <div className="dashboard-signoff">A little coordination. A lot less waiting.<span>That’s counterline.</span></div>
      </main>
    </div>
    {compose && <RequestModal actor={actor} onClose={() => setCompose(false)} onSubmit={handleCreate} />}
    {settingsOpen && <SettingsDialog settings={data.settings} onClose={() => setSettingsOpen(false)} onSave={async (settings) => { await saveSettings(settings); notify("Alert settings saved. Your warehouse is up to date."); }} />}
    {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    {detailsRequest && <DetailsDialog request={detailsRequest} onClose={() => setDetailsId(null)} onStatus={handleStatus} onPreview={preview} />}
    {image && <ImageViewer src={image.src} name={image.name} onClose={() => setImage(null)} />}
    {toast && <Toast message={toast.message} error={toast.error} onClose={dismissToast} />}
  </div>;
}

function RequestCard({ request, busy, onStatus, onDetails, onPreview }: { request: PickRequest; busy: boolean; onStatus: (request: PickRequest, status: RequestStatus) => Promise<boolean>; onDetails: () => void; onPreview: (src: string, name: string) => void }) {
  return <article className={`request-card ${request.priority === "urgent" && request.status !== "completed" ? "request-urgent" : ""}`}>
    <div className="card-top"><button className="order-link" onClick={onDetails}><span className="order-package"><Package size={15} strokeWidth={1.7} /></span><strong>#{request.orderNumber}</strong></button><div className="card-top-right"><StatusBadge status={request.status} /><button className="icon-button card-more" onClick={onDetails} aria-label={`View details for order ${request.orderNumber}`}><MoreHorizontal size={18} /></button></div></div>
    <div className="card-customer-row"><h3>{request.customer || "Trade counter order"}</h3>{request.priority === "urgent" && <span className="urgent-label"><Flag size={10} fill="currentColor" />Urgent</span>}</div>
    <p className="card-message">{request.message}</p>
    <div className="card-attachment-slot">{request.attachment ? <button className="card-attachment" onClick={() => onPreview(request.attachment!, request.attachmentName || "Order screenshot")}><span className="attachment-thumbnail"><img src={request.attachment} alt="" /></span><Paperclip size={11} /><span>1 visual note</span><ArrowUpRight size={12} /></button> : <span className="collection-label"><MapPin size={12} />Counter collection</span>}{request.status === "picking" && <span className="picker-label">{shortName(request.pickedBy || "Warehouse team")} is picking</span>}</div>
    <div className="card-footer"><div className="card-author"><Avatar name={request.status === "completed" ? request.completedBy || request.createdBy : request.createdBy} size="xs" /><span><strong>{shortName(request.status === "completed" ? request.completedBy || request.createdBy : request.createdBy)}</strong><small suppressHydrationWarning><Clock3 size={10} />{relativeTime(request.completedAt || request.createdAt)}</small></span></div><div className="card-actions">{request.status === "completed" ? <button className="button-card button-details" onClick={onDetails}>View details<ArrowUpRight size={13} /></button> : request.status === "picking" ? <button className="button-card button-complete" disabled={busy} onClick={() => void onStatus(request, "completed")}>{busy ? <Spinner /> : <Check size={14} />}Mark complete</button> : <><button className="button-card button-start" disabled={busy} onClick={() => void onStatus(request, "picking")}>{busy ? <Spinner /> : null}Start picking<ArrowRight size={13} /></button><button className="quick-complete" disabled={busy} onClick={() => void onStatus(request, "completed")} aria-label={`Mark order ${request.orderNumber} complete`} title="Mark complete"><Check size={16} /></button></>}</div></div>
  </article>;
}
