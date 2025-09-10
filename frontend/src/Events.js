// frontend/src/Events.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

export default function Events() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    const [events, setEvents] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // add modal
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", location: "", startAt: "", endAt: "" });

    // edit modal (NEW)
    const [showEdit, setShowEdit] = useState(false);
    const [editEvent, setEditEvent] = useState(null); // {id, name, description, location, startAt, endAt}

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/events");
                if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
                const data = await res.json();
                setEvents(Array.isArray(data) ? data : (data.content || []));
                setErr("");
            } catch (e) {
                setErr(e.message || "Failed to load events");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const t = q.toLowerCase();
        return events.filter(ev =>
            (ev.name || "").toLowerCase().includes(t) ||
            (ev.description || "").toLowerCase().includes(t) ||
            (ev.location || "").toLowerCase().includes(t) ||
            String(ev.id).includes(t)
        );
    }, [events, q]);

    const handleAddChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const createEvent = async e => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/events?requesterEmail=${encodeURIComponent(user.email)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || `Create failed (${res.status})`);
            setEvents(prev => [body, ...prev]);
            setShowAdd(false);
            setForm({ name: "", description: "", location: "", startAt: "", endAt: "" });
        } catch (e2) {
            alert(e2.message || "Create failed");
        }
    };

    // --- Admin actions: Edit/Delete ---
    const openEdit = (ev) => {
        if (!isAdmin) return;
        setEditEvent({
            id: ev.id,
            name: ev.name || "",
            description: ev.description || "",
            location: ev.location || "",
            startAt: ev.startAt || "",
            endAt: ev.endAt || ""
        });
        setShowEdit(true);
    };

    const handleEditChange = e => {
        const { name, value } = e.target;
        setEditEvent(prev => ({ ...prev, [name]: value }));
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!isAdmin || !editEvent) return;
        try {
            const res = await fetch(`/api/events/${editEvent.id}?requesterEmail=${encodeURIComponent(user.email)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editEvent.name,
                    description: editEvent.description,
                    location: editEvent.location,
                    startAt: editEvent.startAt,
                    endAt: editEvent.endAt
                })
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || `Update failed (${res.status})`);
            setEvents(prev => prev.map(v => v.id === editEvent.id ? body : v));
            setShowEdit(false);
            setEditEvent(null);
            alert("Event updated");
        } catch (e2) {
            alert(e2.message || "Update failed");
        }
    };

    const deleteEvent = async (ev) => {
        if (!isAdmin) return;
        if (!window.confirm(`Delete event "${ev.name}"?`)) return;
        try {
            const res = await fetch(`/api/events/${ev.id}?requesterEmail=${encodeURIComponent(user.email)}`, {
                method: "DELETE"
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || `Delete failed (${res.status})`);
            setEvents(prev => prev.filter(e => e.id !== ev.id));
        } catch (e2) {
            alert(e2.message || "Delete failed");
        }
    };

    return (
        <div style={s.wrap}>
            <div style={s.header}>
                <h2>Events</h2>
                <div>
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={s.search} />
                    <a href="#/" style={s.backLink}>← Home</a>
                    {isAdmin && (
                        <button style={s.addBtn} onClick={() => setShowAdd(true)}>+ Add Event</button>
                    )}
                </div>
            </div>

            {loading && <p>Loading…</p>}
            {err && <p style={{ color: "red" }}>{err}</p>}

            {!loading && !err && (
                <div style={s.table}>
                    <div style={{ ...s.row, ...s.head }}>
                        <div style={{ width: 70 }}>ID</div>
                        <div style={{ flex: 2 }}>Name</div>
                        <div style={{ flex: 2 }}>When</div>
                        <div style={{ flex: 2 }}>Location</div>
                        {isAdmin && <div style={{ width: 200, textAlign: "right" }}>Actions</div>}
                    </div>

                    {filtered.map(ev => (
                        <div key={ev.id} style={s.row}>
                            <div style={{ width: 70 }}>{ev.id}</div>
                            <div style={{ flex: 2 }}>
                                <a href={`#/event/${ev.id}`} style={{ textDecoration: "none" }}>{ev.name}</a>
                            </div>
                            <div style={{ flex: 2 }}>
                                {ev.startAt ? new Date(ev.startAt).toLocaleString() : ""}
                                {ev.endAt ? ` — ${new Date(ev.endAt).toLocaleString()}` : ""}
                            </div>
                            <div style={{ flex: 2 }}>{ev.location || "-"}</div>

                            {isAdmin && (
                                <div style={{ width: 200, textAlign: "right" }}>
                                    <button style={s.editBtn} onClick={() => openEdit(ev)}>Edit</button>
                                    <button style={s.delBtn} onClick={() => deleteEvent(ev)}>Delete</button>
                                </div>
                            )}
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div style={{ padding: "12px 8px" }}>No events found.</div>
                    )}
                </div>
            )}

            {/* ADD MODAL */}
            {isAdmin && showAdd && (
                <div style={s.backdrop}>
                    <div style={s.modal}>
                        <h3 style={{ marginTop: 0 }}>Add Event</h3>
                        <form onSubmit={createEvent} style={{ display: "grid", gap: 10 }}>
                            <input name="name" placeholder="Name" value={form.name} onChange={handleAddChange} required style={s.input} />
                            <input name="location" placeholder="Location" value={form.location} onChange={handleAddChange} style={s.input} />
                            <input name="startAt" placeholder="Start (YYYY-MM-DDTHH:mm:ss)" value={form.startAt} onChange={handleAddChange} style={s.input} />
                            <input name="endAt" placeholder="End (optional, YYYY-MM-DDTHH:mm:ss)" value={form.endAt} onChange={handleAddChange} style={s.input} />
                            <textarea name="description" placeholder="Description" value={form.description} onChange={handleAddChange} rows={4} style={s.textarea} />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={s.cancelBtn}>Cancel</button>
                                <button type="submit" style={s.saveBtn}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL (admins) */}
            {isAdmin && showEdit && editEvent && (
                <div style={s.backdrop}>
                    <div style={s.modal}>
                        <h3 style={{ marginTop: 0 }}>Edit Event</h3>
                        <form onSubmit={saveEdit} style={{ display: "grid", gap: 10 }}>
                            <input name="name" placeholder="Name" value={editEvent.name} onChange={handleEditChange} required style={s.input} />
                            <input name="location" placeholder="Location" value={editEvent.location} onChange={handleEditChange} style={s.input} />
                            <input name="startAt" placeholder="Start (YYYY-MM-DDTHH:mm:ss)" value={editEvent.startAt || ""} onChange={handleEditChange} tyle={s.input} />
                            <input name="endAt" placeholder="End (optional, YYYY-MM-DDTHH:mm:ss)" value={editEvent.endAt || ""} onChange={handleEditChange} style={s.input} />
                            <textarea name="description" placeholder="Description" value={editEvent.description} onChange={handleEditChange} rows={4} style={s.textarea} />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                <button type="button" onClick={() => { setShowEdit(false); setEditEvent(null); }} style={s.cancelBtn}>Cancel</button>
                                <button type="submit" style={s.saveBtn}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    wrap: { padding: 20, maxWidth: 1100, margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0, marginTop: 30 },
    search: { padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6, marginRight: 12 },
    backLink: { textDecoration: "none", border: "1px solid #ccc", padding: "6px 10px", borderRadius: 6, background: "#f8f8f8", color: "#333", marginLeft: 8 },
    addBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6, marginLeft: 8 },

    table: { background: "#fff", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" },
    row: { display: "flex", gap: 8, padding: "10px 8px", borderBottom: "1px solid #eee", alignItems: "center" },
    head: { background: "#f5f5f5", fontWeight: "bold" },

    // actions
    delBtn: { padding: "6px 10px", background: "#b00020", color: "#fff", border: "none", borderRadius: 6, marginLeft: 8 },
    editBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6 },

    // modal
    backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modal: { background: "#fff", padding: 20, borderRadius: 8, width: 520, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
    input: { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 },
    textarea: { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 },
    cancelBtn: { padding: "6px 10px", background: "#ccc", color: "#000", border: "none", borderRadius: 6 },
    saveBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6 }
};
