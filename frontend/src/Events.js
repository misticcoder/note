import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import EditEventModal from "./Events/EditEventModal";
import "./styles/events.css";

export default function Events() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [q, setQ] = useState("");
    const [sort, setSort] = useState("date");

    const [editingEvent, setEditingEvent] = useState(null);

    /* =====================
       LOAD EVENTS
    ===================== */
    useEffect(() => {
        document.title = "Events | InfCom";

        (async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/events");
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
    }, []);

    /* =====================
       SEARCH
    ===================== */
    const filtered = useMemo(() => {
        const t = q.toLowerCase();
        return events.filter(e =>
            (e.title || "").toLowerCase().includes(t) ||
            (e.content || "").toLowerCase().includes(t) ||
            (e.location || "").toLowerCase().includes(t)
        );
    }, [events, q]);

    /* =====================
       SORT (IMDb STYLE)
    ===================== */
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            if (sort === "title") {
                return a.title.localeCompare(b.title);
            }
            if (sort === "status") {
                return (a.status || "").localeCompare(b.status || "");
            }
            // default: start date
            return new Date(a.startAt || 0) - new Date(b.startAt || 0);
        });
    }, [filtered, sort]);

    /* =====================
       ADMIN: EDIT
    ===================== */
    const saveEvent = async (updates) => {
        if (!editingEvent || !user) return;

        const res = await fetch(
            `/api/events/${editingEvent.id}?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            }
        );

        const body = await res.json();
        if (!res.ok) {
            alert(body.message || "Update failed");
            return;
        }

        setEvents(events =>
            events.map(e => (e.id === body.id ? body : e))
        );
        setEditingEvent(null);
    };

    /* =====================
       ADMIN: DELETE
    ===================== */
    const deleteEvent = async (ev) => {
        if (!window.confirm("Delete this event?")) return;

        const res = await fetch(
            `/api/events/${ev.id}?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            { method: "DELETE" }
        );

        if (!res.ok) {
            alert("Delete failed");
            return;
        }

        setEvents(events =>
            events.filter(e => e.id !== ev.id)
        );
    };

    /* =====================
       RENDER
    ===================== */
    return (
        <main className="events-page">
            <header className="events-top">
                <h1>Events</h1>

                <div className="events-controls">
                    <input
                        placeholder="Search events…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="date">Sort by Start Date</option>
                        <option value="title">Sort by Title</option>
                        <option value="status">Sort by Status</option>
                    </select>
                </div>
            </header>

            {loading && <p className="muted">Loading…</p>}
            {err && <p className="error">{err}</p>}

            {!loading && !err && (
                <div className="events-table">
                    <div className="events-header">
                        <div>#</div>
                        <div>Event</div>
                        <div>Status</div>
                        <div>Actions</div>
                    </div>

                    {sorted.map((ev, i) => (
                        <div key={ev.id} className="events-row">
                            {/* Rank */}
                            <div className="rank">{i + 1}</div>

                            {/* Event Info */}
                            <div className="event-main">
                                <div className="event-title">
                                    {ev.title}
                                </div>
                                <div className="event-meta">
                                    {ev.startAt
                                        ? new Date(ev.startAt).toLocaleString()
                                        : "TBA"}
                                    {ev.location && ` · ${ev.location}`}
                                </div>
                            </div>

                            {/* Status */}
                            <div
                                className={`event-status ${
                                    (ev.status || "UPCOMING").toLowerCase()
                                }`}
                            >
                                {ev.status || "UPCOMING"}
                            </div>

                            {/* Admin Actions */}
                            <div className="event-actions">
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() =>
                                                setEditingEvent(ev)
                                            }
                                            title="Edit"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            className="danger"
                                            onClick={() =>
                                                deleteEvent(ev)
                                            }
                                            title="Delete"
                                        >
                                            🗑
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* EDIT MODAL */}
            {editingEvent && (
                <EditEventModal
                    event={editingEvent}
                    onSave={saveEvent}
                    onClose={() => setEditingEvent(null)}
                />
            )}
        </main>
    );
}
