import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import EditEventModal from "./Events/EditEventModal";
import "./styles/events.css";
import EventTable from "./Events/EventTable";
import "./styles/index.css"

export default function Events() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [q, setQ] = useState("");
    const [sort, setSort] = useState("date");

    const [editingEvent, setEditingEvent] = useState(null);
    const [ratings, setRatings] = useState({});

    const [clubs, setClubs] = useState([]);


    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({
        title: "",
        content: "",
        location: "",
        startAt: "",
        endAt: "",
        tags: "",
        clubId:""
    });


    const [status, setStatus] = useState("all");      // upcoming | ongoing | past | all
    const [allTags, setAllTags] = useState([]);            // list of tag names from backend
    const [selectedTags, setSelectedTags] = useState([]);  // selected tag names


    const [hash, setHash] = useState(window.location.hash);

    useEffect(() => {
        const onHashChange = () => setHash(window.location.hash);
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    const tagFromRoute = useMemo(() => {
        const m = hash.match(/^#\/events\/tag\/([^/]+)/);
        return m ? decodeURIComponent(m[1]) : null;
    }, [hash]);

    const clubFromRoute = useMemo(() => {
        const m = hash.match(/^#\/events\/club\/(\d+)/);
        return m ? Number(m[1]) : null;
    }, [hash]);


    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/clubs");
                if (!res.ok) return;
                const data = await res.json();
                setClubs(Array.isArray(data) ? data : []);
            } catch {
                setClubs([]);
            }
        })();
    }, []);


    useEffect(() => {
        if (!tagFromRoute) return;

        setSelectedTags(prev =>
            prev.length === 1 && prev[0] === tagFromRoute
                ? prev
                : [tagFromRoute]
        );

        setStatus("all");
    }, [tagFromRoute]);

    useEffect(() => {
        if (!clubFromRoute) return;

        setSelectedTags([]);
        setQ("");
        setStatus("all");
    }, [clubFromRoute]);




    /* =====================
       HELPERS
    ===================== */
    const STATUS_ORDER = {
        LIVE: 0,
        UPCOMING: 1,
        ENDED: 2,
    };

    const getEventStatus = (ev) => {
        if (!ev?.startAt) return "UPCOMING";

        const now = new Date();
        const start = new Date(ev.startAt);

        const end = ev.endAt
            ? new Date(ev.endAt)
            : new Date(start.getTime() + 2 * 60 * 60 * 1000); // fallback 2h

        if (now >= start && now <= end) return "LIVE";
        if (now > end) return "ENDED";
        return "UPCOMING";
    };

    async function fetchRating(eventId) {
        try {
            const res = await fetch(`/api/events/${eventId}/rating`);
            if (!res.ok) return { average: 0, count: 0 };
            return await res.json();
        } catch {
            return { average: 0, count: 0 };
        }
    }


    /* =====================
       LOAD EVENTS
    ===================== */
    useEffect(() => {
        document.title = "Events | InfCom";

        (async () => {
            try {
                setLoading(true);

                let url;

                if (clubFromRoute) {
                    url = `/api/events/club/${clubFromRoute}?status=${status}`;
                }
                else if (tagFromRoute) {
                    url = `/api/events/tag/${encodeURIComponent(tagFromRoute)}?status=${status}`;
                }
                else {
                    const params = new URLSearchParams();
                    if (q.trim()) params.set("q", q.trim());
                    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
                    if (status) params.set("status", status);

                    url = `/api/events?${params.toString()}`;
                }


                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to load events");

                const data = await res.json();
                setEvents(Array.isArray(data) ? data : []);
                setErr("");
                setRatings({});
            } catch (e) {
                setErr(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [q, selectedTags, status, tagFromRoute, clubFromRoute]);




    /* =====================
       LOAD TAGS
    ===================== */

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/tags");
                if (!res.ok) return;
                const data = await res.json();
                setAllTags(Array.isArray(data) ? data : []);
            } catch {
                // ignore for MVP
            }
        })();
    }, []);


    /* =====================
       LOAD RATINGS (per event)
    ===================== */
    useEffect(() => {
        if (events.length === 0) return;

        let cancelled = false;

        (async () => {
            const entries = await Promise.all(
                events.map(async (e) => {
                    const r = await fetchRating(e.id);
                    return [e.id, r];
                })
            );

            if (!cancelled) {
                // keep only successful payloads
                const next = Object.fromEntries(entries.filter(([, v]) => v));
                setRatings(next);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [events]);

    /* =====================
       Local SEARCH

       const filtered = useMemo(() => {
        const t = q.toLowerCase();
        return events.filter((e) =>
            (e.title || "").toLowerCase().includes(t) ||
            (e.content || "").toLowerCase().includes(t) ||
            (e.location || "").toLowerCase().includes(t)
        );
    }, [events, q]);

    ===================== */


    /* =====================
       SORT (IMDb STYLE)
       - Default grouping: LIVE -> UPCOMING -> ENDED
       - Then applies selected sort within each group
    ===================== */
    const visibleEvents = useMemo(() => {
        if (status === "all") return events;

        return events.filter(ev => {
            const s = getEventStatus(ev);

            if (status === "upcoming") return s === "UPCOMING";
            if (status === "ongoing") return s === "LIVE";
            if (status === "past") return s === "ENDED";

            return true;
        });
    }, [events, status]);

    const sorted = useMemo(() => {
        const arr = [...visibleEvents];

        arr.sort((a, b) => {
            const statusA = getEventStatus(a);
            const statusB = getEventStatus(b);

            const sa = STATUS_ORDER[statusA] ?? 1;
            const sb = STATUS_ORDER[statusB] ?? 1;

            if (sa !== sb) return sa - sb;

            if (sort === "title") {
                return (a.title || "").localeCompare(b.title || "");
            }

            return new Date(a.startAt || 0) - new Date(b.startAt || 0);
        });

        return arr;
    }, [visibleEvents, sort]);



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
                body: JSON.stringify(updates),
            }
        );

        const body = await res.json();
        if (!res.ok) {
            alert(body.message || "Update failed");
            return;
        }

        setEvents((prev) => prev.map((e) => (e.id === body.id ? body : e)));
        setEditingEvent(null);
    };

    /* =====================
       ADMIN: DELETE
    ===================== */
    const deleteEvent = async (ev) => {
        if (!window.confirm("Delete this event?")) return;

        console.log("Deleting event:", ev.id, "as", user?.email, user?.role);

        const res = await fetch(
            `/api/events/${ev.id}?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "DELETE" }
        );

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            alert(body.message || `Delete failed (${res.status})`);
            return;
        }

        setEvents((prev) => prev.filter((e) => e.id !== ev.id));

        setRatings((prev) => {
            const next = { ...prev };
            delete next[ev.id];
            return next;
        });
    };


    // FORM HANDLER
    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // CREATE EVENT — EXACT BACKEND CONTRACT
    const createEvent = async e => {
        e.preventDefault();
        if (!isAdmin) return;

        if (!form.title.trim() || !form.startAt) {
            alert("name and startAt are required");
            return;
        }

        const payload = {
            title: form.title.trim(),
            content: form.content.trim(),
            location: form.location.trim(),
            startAt: form.startAt,
            endAt: form.endAt || "",
            tags: form.tags
                ? form.tags.split(",").map(t => t.trim()).filter(Boolean)
                : [],
            clubId: form.clubId !== "" ? form.clubId : null
        };


        console.log("CREATE EVENT PAYLOAD:", payload);

        try {
            const res = await fetch(
                `/api/events?requesterEmail=${encodeURIComponent(user.email)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );

            const body = await res.json();
            if (!res.ok) throw new Error(body.message || "Create failed");

            setEvents(prev => [body, ...prev]);
            setShowAdd(false);
            setForm({ title: "", content: "", location: "", startAt: "", endAt: "", tags: "", clubId: "" });
        } catch (e2) {
            alert(e2.message);
        }
    };

    /* =====================
       RENDER
    ===================== */
    return (
        <div className={"page"}>
            <div className="container">
                <div className={"table-wrap"}>
                    <div className="events-top">
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
                                aria-label="Sort events"
                            >
                                <option value="date">Sort by Start Date</option>
                                <option value="title">Sort by Title</option>
                                <option value="status">Sort by Status</option>
                            </select>
                        </div>

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

                        {allTags.length > 0 && (
                            <div className="event-tags-filter">
                                {allTags.map(tag => {
                                    const tagName = typeof tag === "string" ? tag : tag.name;
                                    const active = selectedTags.includes(tagName);

                                    return (
                                        <span
                                            key={tagName}
                                            className={`tag-chip ${active ? "active" : ""}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.hash = `#/events/tag/${encodeURIComponent(tagName)}`;
                                            }}

                                        >
                                    {tagName}
                                </span>
                                    );
                                })}

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    disabled={selectedTags.length === 0}
                                    onClick={() => {
                                        setSelectedTags([]);
                                        setStatus("upcoming");
                                        window.location.hash = "#/events";
                                    }}
                                >
                                    Clear
                                </button>


                            </div>
                        )}


                        {isAdmin && (
                            <button title={"Create new event"} className={"dbutton"} style={{color:"#ffffe3"}} onClick={() => setShowAdd(true)}>
                                + Add Event
                            </button>
                        )}

                        {/* ADD MODAL */}
                        {isAdmin && showAdd && (
                            <div className={"events-controls"}>
                                <div>
                                    <h3>Add Event</h3>
                                    <form onSubmit={createEvent} style={{display: "grid", gap: 10}}>

                                        <select
                                            value={form.clubId || ""}
                                            onChange={e => setForm(f => ({...f, clubId: e.target.value}))}
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
                                            className={"input"}
                                        />

                                        <textarea
                                            name="content"
                                            placeholder="Description"
                                            value={form.content}
                                            onChange={handleChange}
                                            rows={4}
                                            className={"textarea"}
                                        />

                                        <input
                                            name="location"
                                            placeholder="Location"
                                            value={form.location}
                                            onChange={handleChange}
                                            className={"input"}
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
                                                setForm(prev => ({...prev, tags: e.target.value}))
                                            }
                                        />


                                        <div style={{display: "flex", justifyContent: "flex-end", gap: 8}}>
                                            <button type="button" onClick={() => setShowAdd(false)}
                                                    className={"cancel-btn"}>
                                                Cancel
                                            </button>
                                            <button type="submit" className={"btn-primary"}>
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

                    {!loading && !err && (
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
