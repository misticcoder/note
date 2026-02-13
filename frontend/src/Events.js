import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import EditEventModal from "./Events/EditEventModal";
import "./styles/events.css";
import EventTable from "./Events/EventTable";
import "./styles/index.css"
import "./styles/modal.css";

import { apiFetch } from "./api";
import { useEventActions } from "./hooks/useEventActions";


export default function Events() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [q, setQ] = useState("");
    const [sort, setSort] = useState("date");

    const {
        editingEvent,
        setEditingEvent,
        saveEvent,
        deleteEvent
    } = useEventActions({ user, setEvents });

    const [clubs, setClubs] = useState([]);

    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({
        title: "",
        content: "",
        location: "",
        startAt: "",
        endAt: "",
        tags: "",
        clubId: "",
        visibility: "PUBLIC",
        category: "INTERNAL",
        externalUrl: ""
    });

    const [status, setStatus] = useState("all");
    const [timePeriod, setTimePeriod] = useState("all");

    // Load clubs
    useEffect(() => {
        (async () => {
            try {
                const res = await apiFetch("/api/clubs");
                if (!res.ok) return;
                const data = await res.json();
                setClubs(Array.isArray(data) ? data : []);
            } catch {
                setClubs([]);
            }
        })();
    }, []);

    // Auto-adjust visibility when club changes
    useEffect(() => {
        if (!form.clubId) {
            setForm(f => ({ ...f, visibility: "PUBLIC" }));
        }
    }, [form.clubId]);

    // Load events
    useEffect(() => {
        document.title = "Events | InfCom";

        (async () => {
            try {
                setLoading(true);

                const params = new URLSearchParams();
                if (q.trim()) params.set("q", q.trim());
                params.set("status", status);

                if (timePeriod !== "all") {
                    params.set("timePeriod", timePeriod);
                }

                let url = `/api/events?${params.toString()}`;

                const finalUrl = user
                    ? `${url}${url.includes("?") ? "&" : "?"}requesterEmail=${encodeURIComponent(user.email)}`
                    : url;

                const res = await apiFetch(finalUrl);
                if (!res.ok) throw new Error("Failed to load events");

                const data = await res.json();
                setEvents(Array.isArray(data) ? data : []);
                setErr("");
            } catch (e) {
                setErr(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [q, status, timePeriod, user?.email]);

    // Sort events
    const visibleEvents = useMemo(() => {
        if (status === "all") return events;

        const map = {
            upcoming: "UPCOMING",
            ongoing: "LIVE",
            past: "ENDED",
        };

        return events.filter(ev => ev.status === map[status]);
    }, [events, status]);

    const sorted = useMemo(() => {
        const arr = [...visibleEvents];

        const STATUS_ORDER = {
            LIVE: 0,
            UPCOMING: 1,
            ENDED: 2,
        };

        arr.sort((a, b) => {
            const sa = STATUS_ORDER[a.status] ?? 1;
            const sb = STATUS_ORDER[b.status] ?? 1;

            if (sa !== sb) return sa - sb;

            if (sort === "title") {
                return (a.title || "").localeCompare(b.title || "");
            }

            return new Date(a.startAt || 0) - new Date(b.startAt || 0);
        });

        return arr;
    }, [visibleEvents, sort]);

    // Form handler
    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // Create event
    const createEvent = async e => {
        e.preventDefault();
        if (!isAdmin) return;

        if (!form.title.trim() || !form.startAt) {
            alert("Title and start date are required");
            return;
        }

        if (form.category === "EXTERNAL" && !form.externalUrl.trim()) {
            alert("External link is required for external events");
            return;
        }

        const payload = {
            title: form.title.trim(),
            content: form.content.trim(),
            location: form.location.trim(),
            startAt: form.startAt,
            endAt: form.endAt || null,
            visibility: form.visibility,
            tags: form.tags
                ? form.tags.split(",").map(t => t.trim()).filter(Boolean)
                : [],
            clubId: form.clubId !== "" ? Number(form.clubId) : null,
            category: form.category,
            externalUrl: form.category === "EXTERNAL" ? form.externalUrl.trim() : null
        };

        try {
            const res = await apiFetch(
                `/api/events?requesterEmail=${encodeURIComponent(user.email)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );

            const body = await res.json();
            if (!res.ok) throw new Error(body.message || "Create failed");

            setEvents(prev => [body.event, ...prev]);

            setShowAdd(false);
            setForm({
                title: "",
                content: "",
                location: "",
                startAt: "",
                endAt: "",
                tags: "",
                clubId: "",
                visibility: "PUBLIC",
                category: "INTERNAL",
                externalUrl: ""
            });

        } catch (e2) {
            alert(e2.message);
        }
    };

    return (
        <div className={"page"}>
            <div className="container">
                <div className={"table-wrap"}>
                    <div className="events-top">
                        <div className="events-title-row">
                            <h1>Events</h1>

                            {isAdmin && (
                                <button
                                    title="Create new event"
                                    className="dbutton add-event-btn"
                                    onClick={() => setShowAdd(true)}
                                >
                                    + Add Event
                                </button>
                            )}
                        </div>

                        <div className="events-controls">
                            <input
                                className="search-input"
                                placeholder="Search events…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />

                            <select
                                className="sort-select"
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                aria-label="Sort events"
                            >
                                <option value="date">Sort by Start Date</option>
                                <option value="title">Sort by Title</option>
                            </select>
                        </div>

                        <div className="event-filters-container">
                            <div className="filter-group">
                                <label className="filter-label">Status:</label>
                                <div className="event-status-tabs">
                                    {[
                                        {key: "upcoming", label: "Upcoming"},
                                        {key: "ongoing", label: "Ongoing"},
                                        {key: "past", label: "Past"},
                                        {key: "all", label: "All"},
                                    ].map(t => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            className={status === t.key ? "active" : ""}
                                            onClick={() => setStatus(t.key)}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">Time:</label>
                                <div className="event-time-period-tabs">
                                    {[
                                        {key: "today", label: "Today"},
                                        {key: "week", label: "This Week"},
                                        {key: "month", label: "This Month"},
                                        {key: "all", label: "All Time"},
                                    ].map(t => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            className={timePeriod === t.key ? "active" : ""}
                                            onClick={() => setTimePeriod(t.key)}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ADD MODAL */}
                        {isAdmin && showAdd && (
                            <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
                                <div
                                    className="modal-card"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h3>Add Event</h3>

                                    <form onSubmit={createEvent} className="modal-form">
                                        <select
                                            value={form.category}
                                            onChange={e =>
                                                setForm(f => ({
                                                    ...f,
                                                    category: e.target.value,
                                                    externalUrl: e.target.value === "INTERNAL" ? "" : f.externalUrl
                                                }))
                                            }
                                        >
                                            <option value="INTERNAL">Internal event</option>
                                            <option value="EXTERNAL">External event</option>
                                        </select>

                                        {form.category === "EXTERNAL" && (
                                            <input
                                                type="url"
                                                placeholder="External link (https://...)"
                                                value={form.externalUrl}
                                                onChange={e =>
                                                    setForm(f => ({ ...f, externalUrl: e.target.value }))
                                                }
                                                required
                                            />
                                        )}

                                        <select
                                            value={form.clubId || ""}
                                            onChange={e => setForm(f => ({ ...f, clubId: e.target.value }))}
                                        >
                                            <option value="">No Club (Independent)</option>
                                            {clubs.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>

                                        <input
                                            name="title"
                                            placeholder="Event Name"
                                            value={form.title}
                                            onChange={handleChange}
                                            required
                                        />

                                        <textarea
                                            name="content"
                                            placeholder="Description"
                                            value={form.content}
                                            onChange={handleChange}
                                            rows={4}
                                        />

                                        <input
                                            name="location"
                                            placeholder="Location"
                                            value={form.location}
                                            onChange={handleChange}
                                        />

                                        <input
                                            type="datetime-local"
                                            name="startAt"
                                            value={form.startAt}
                                            onChange={handleChange}
                                            required
                                        />

                                        <input
                                            type="datetime-local"
                                            name="endAt"
                                            value={form.endAt}
                                            onChange={handleChange}
                                        />

                                        <input
                                            placeholder="Tags (comma separated)"
                                            value={form.tags || ""}
                                            onChange={e =>
                                                setForm(prev => ({ ...prev, tags: e.target.value }))
                                            }
                                        />

                                        <select
                                            value={form.visibility}
                                            onChange={e =>
                                                setForm(f => ({ ...f, visibility: e.target.value }))
                                            }
                                        >
                                            <option value="PUBLIC">Visible to everyone</option>
                                            <option value="CLUB_MEMBERS">Club members only</option>
                                        </select>

                                        <div className="modal-actions">
                                            <button
                                                type="button"
                                                className="cancelBtn"
                                                onClick={() => setShowAdd(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="saveBtn">
                                                Create
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                    {loading && <p className="muted">Loading…</p>}
                    {err && <p className="error">{err}</p>}

                    {!loading && !err && sorted.length === 0 && (
                        <p className="muted">
                            No events found.
                        </p>
                    )}

                    {!loading && !err && sorted.length > 0 && (
                        <EventTable
                            events={sorted}
                            loading={loading}
                            error={err}
                            showClub={true}
                            isPrivileged={isAdmin}
                            onEdit={setEditingEvent}
                            onDelete={deleteEvent}
                        />
                    )}

                    {/* EDIT MODAL */}
                    {editingEvent && (
                        <EditEventModal
                            event={editingEvent}
                            clubs={clubs}
                            onSave={saveEvent}
                            onClose={() => setEditingEvent(null)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}