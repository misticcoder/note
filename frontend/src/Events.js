import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import "./styles/index.css";


export default function Events() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    const [events, setEvents] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // ADD MODAL STATE — MUST MATCH BACKEND
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        location: "",
        startAt: "",
        endAt: ""
    });

    // LOAD EVENTS
    useEffect(() => {
        document.title = "Events Directory | InfCom";
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

    // SEARCH
    const filtered = useMemo(() => {
        const t = q.toLowerCase();
        return events.filter(e =>
            (e.title || "").toLowerCase().includes(t) ||
            (e.content || "").toLowerCase().includes(t) ||
            (e.location || "").toLowerCase().includes(t)
        );
    }, [events, q]);

    // FORM HANDLER
    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // CREATE EVENT — EXACT BACKEND CONTRACT
    const createEvent = async e => {
        e.preventDefault();
        if (!isAdmin) return;

        if (!form.name.trim() || !form.startAt) {
            alert("name and startAt are required");
            return;
        }

        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            location: form.location.trim(),
            startAt: form.startAt,
            endAt: form.endAt || ""
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
            setForm({ name: "", description: "", location: "", startAt: "", endAt: "" });
        } catch (e2) {
            alert(e2.message);
        }
    };

    return (
        <div style={s.wrap}>
            <div style={s.header}>
                <h2 className={"title"}>Events</h2>
                <div>
                    <input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search…"
                        style={s.search}
                    />
                    <a href="#/" style={s.backLink}>← Home</a>
                    {isAdmin && (
                        <button style={s.addBtn} onClick={() => setShowAdd(true)}>
                            + Add Event
                        </button>
                    )}
                </div>
            </div>

            {loading && <p>Loading…</p>}
            {err && <p style={{ color: "red" }}>{err}</p>}

            {!loading && !err && (
                <div style={s.table}>
                    {filtered.map(ev => (
                        <div key={ev.id} style={s.row}>
                            <div style={{ flex: 2 }}>{ev.title}</div>
                            <div style={{ flex: 2 }}>
                                {ev.startAt ? new Date(ev.startAt).toLocaleString() : "-"}
                            </div>
                            <div style={{ flex: 2 }}>{ev.location || "-"}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADD MODAL */}
            {isAdmin && showAdd && (
                <div style={s.backdrop}>
                    <div style={s.modal}>
                        <h3>Add Event</h3>
                        <form onSubmit={createEvent} style={{ display: "grid", gap: 10 }}>

                            <input
                                name="name"
                                placeholder="Event Name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                style={s.input}
                            />

                            <textarea
                                name="description"
                                placeholder="Description"
                                value={form.description}
                                onChange={handleChange}
                                rows={4}
                                style={s.textarea}
                            />

                            <input
                                name="location"
                                placeholder="Location"
                                value={form.location}
                                onChange={handleChange}
                                style={s.input}
                            />

                            <input
                                type="datetime-local"
                                name="startAt"
                                value={form.startAt}
                                onChange={handleChange}
                                required
                                style={s.input}
                            />

                            <input
                                type="datetime-local"
                                name="endAt"
                                value={form.endAt}
                                onChange={handleChange}
                                style={s.input}
                            />

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={s.cancelBtn}>
                                    Cancel
                                </button>
                                <button type="submit" style={s.saveBtn}>
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// STYLES
const s = {
    wrap: { width: "100%",
        maxWidth: "1200px",
        padding: "60px 24px 24px",
        boxSizing: "border-box",
        backgroundColor:"#4a4a4a",
    margin:"0 auto"},
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    search: { padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6, marginRight: 12 },
    backLink: { textDecoration: "none", border: "1px solid #ccc", padding: "6px 10px", borderRadius: 6, background: "#f8f8f8", color: "#333", marginLeft: 8 },
    addBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6 },

    table: { background: "#fff", border: "1px solid #ddd", borderRadius: 8 },
    row: { display: "flex", gap: 8, padding: "10px 8px", borderBottom: "1px solid #eee" },

    backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" },
    modal: { background: "#fff", padding: 20, borderRadius: 8, width: 520 },

    input: { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 },
    textarea: { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 },
    cancelBtn: { padding: "6px 10px", background: "#ccc", border: "none", borderRadius: 6 },
    saveBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6 }
};
