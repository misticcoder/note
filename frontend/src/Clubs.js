// frontend/src/AdminClubs.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import "./styles/index.css";
import "./styles/events.css";
import Dropdown from "./components/Dropdown";

export default function Clubs() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");

    // Filters
    const [category, setCategory] = useState("ALL");
    const [sortBy, setSortBy] = useState("NAME_ASC");

    // Edit modal
    const [showEdit, setShowEdit] = useState(false);
    const [editClub, setEditClub] = useState(null);

    /* =========================
       FETCH CLUBS + EVENT COUNTS
    ========================= */
    useEffect(() => {
        document.title = "Clubs Directory | InfCom";

        (async () => {
            try {
                setLoading(true);

                const params = new URLSearchParams();
                if (category !== "ALL") params.set("category", category);
                if (sortBy && sortBy !== "EVENTS_DESC") params.set("sort", sortBy);

                const res = await fetch(`/api/clubs?${params.toString()}`);
                if (!res.ok) throw new Error(`Failed to load clubs (${res.status})`);

                const baseClubs = await res.json();

                const rows = (Array.isArray(baseClubs) ? baseClubs : []).map(c => ({
                    id: c.id,
                    name: c.name ?? "",
                    description: c.description ?? "",
                    category: c.category ?? "OTHER",
                    createdAt: c.createdAt ? new Date(c.createdAt) : null,
                    memberCount: c.memberCount ?? 0,
                    eventCount: c.eventCount ?? 0,
                    upcomingEventCount: c.upcomingEventCount ?? 0
                }));

                setClubs(rows);
                setErr("");
            } catch (e) {
                console.error(e);
                setErr(e.message || "Failed to load clubs");
            } finally {
                setLoading(false);
            }
        })();
    }, [category, sortBy]);

    /* =========================
       CLIENT FILTER + EVENT SORT
    ========================= */
    const filtered = useMemo(() => {
        const t = (q || "").toLowerCase();

        let out = clubs.filter(cl =>
            cl.name.toLowerCase().includes(t) ||
            cl.description.toLowerCase().includes(t) ||
            String(cl.id).includes(t)
        );

        if (sortBy === "EVENTS_DESC") {
            out = [...out].sort((a, b) => b.eventCount - a.eventCount);
        }

        return out;
    }, [clubs, q, sortBy]);

    /* =========================
       ADMIN ACTIONS
    ========================= */
    const openEdit = (cl) => {
        if (!isAdmin) return;
        setEditClub({ ...cl });
        setShowEdit(true);
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!isAdmin || !editClub) return;

        try {
            const res = await fetch(`/api/clubs/${editClub.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editClub.name,
                    description: editClub.description
                })
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `Update failed (${res.status})`);
            }

            setClubs(prev =>
                prev.map(c => c.id === editClub.id ? { ...c, ...editClub } : c)
            );

            setShowEdit(false);
            setEditClub(null);
            alert("Club updated");
        } catch (e) {
            alert(e.message || "Update failed");
        }
    };

    const deleteClub = async (cl) => {
        if (!isAdmin) return;
        if (!window.confirm(`Delete club "${cl.name}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/clubs/${cl.id}`, { method: "DELETE" });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `Delete failed (${res.status})`);
            }
            setClubs(prev => prev.filter(c => c.id !== cl.id));
        } catch (e) {
            alert(e.message || "Delete failed");
        }
    };

    /* =========================
       RENDER
    ========================= */
    return (
        <div className={"page"}>
            <div className={"container"}>
                <div className={"table-wrap"}>
                    <div className={"events-top"}>
                        <h2 >Clubs</h2>
                        <div>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                style={{...styles.search, marginRight: 8}}
                            >
                                <option value="ALL">All categories</option>
                                <option value="SPORTS">Sports</option>
                                <option value="ACADEMIC">Academic</option>
                                <option value="SOCIETY">Society</option>
                                <option value="FAMILY">Family</option>
                                <option value="SOCIAL">Social</option>
                                <option value="OTHER">Other</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                style={styles.search}
                            >
                                <option value="NAME_ASC">Name (A–Z)</option>
                                <option value="NAME_DESC">Name (Z–A)</option>
                                <option value="CREATED_NEW">Newest first</option>
                                <option value="CREATED_OLD">Oldest first</option>
                                <option value="MEMBERS_DESC">Most members</option>
                                <option value="EVENTS_DESC">Most events</option>
                            </select>

                            <input
                                placeholder="Search by name / description / ID…"
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                style={styles.search}
                            />

                            <a href="#/" style={styles.backLink}>← Back</a>
                        </div>
                    </div>

                    {loading && <p>Loading…</p>}
                    {err && <p style={{color: "red"}}>{err}</p>}

                    {!loading && !err && (
                        <div className={"clubs-table"}>
                            <div className={"clubs-header"}>
                                <div>#</div>
                                <div>Category</div>
                                <div>Name</div>
                                <div>Members</div>
                                <div>Events</div>
                                <div>Upcoming Events</div>
                                {isAdmin && <div>Actions</div>}
                            </div>

                            {filtered.map((cl, idx) => (
                                <div key={cl.id} className={"clubs-row"}>
                                    <div className={"rank"}>{idx + 1}</div>
                                    <div >{cl.category}</div>
                                    <div >
                                        <a href={`#/clubs/${cl.id}`} style={{textDecoration: "none"}}>
                                            {cl.name}
                                        </a>
                                    </div>
                                    <div>{cl.memberCount > 0 ? (
                                        <>
                                            <span className="rating-count">
                                        {cl.memberCount}
                                    </span>
                                        </>
                                    ) : (
                                        <span className="muted">No Members</span>
                                    )}</div>
                                    <div> {cl.eventCount > 0 ? (
                                        <>
                                            <span className="rating-count">
                                                {cl.eventCount}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="muted">No Events</span>
                                    )}</div>
                                    <div> {cl.upcomingEventCount > 0 ? (
                                        <>
                                            <span className="rating-count">
                                                {cl.upcomingEventCount}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="muted">No upcoming Events</span>
                                    )}</div>

                                    {isAdmin && (
                                        <div className="actions">
                                            <Dropdown
                                                onEdit={() => openEdit(cl)}
                                                onDelete={() => onDelete(cl)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {filtered.length === 0 && (
                                <div style={{padding: "12px 8px"}}>No clubs found.</div>
                            )}
                        </div>
                    )}

                    {isAdmin && showEdit && editClub && (
                        <div style={styles.backdrop}>
                            <div style={styles.modal}>
                                <h3>Edit Club</h3>
                                <form onSubmit={saveEdit} style={{display: "flex", flexDirection: "column", gap: 10}}>
                                    <input
                                        value={editClub.name}
                                        onChange={e => setEditClub(c => ({...c, name: e.target.value}))}
                                        required
                                        style={styles.input}
                                    />
                                    <textarea
                                        value={editClub.description}
                                        onChange={e => setEditClub(c => ({...c, description: e.target.value}))}
                                        rows={6}
                                        style={styles.textarea}
                                    />
                                    <div style={{display: "flex", justifyContent: "flex-end", gap: 8}}>
                                        <button type="button" onClick={() => {
                                            setShowEdit(false);
                                            setEditClub(null);
                                        }} style={styles.cancelBtn}>
                                            Cancel
                                        </button>
                                        <button type="submit" style={styles.saveBtn}>Save</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================
   STYLES
========================= */
const styles = {
    wrap: {padding: 20, maxWidth: 1100, margin: "0 auto"},
    headerRow: {display: "flex", justifyContent: "space-between", alignItems: "center"},
    search: {padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6, marginRight: 12},
    backLink: {
        textDecoration: "none",
        border: "1px solid #ccc",
        padding: "6px 10px",
        borderRadius: 6,
        background: "#f8f8f8",
        color: "#333"
    },

    tableWrap: {background: "#fff", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden"},
    row: {display: "flex", gap: 8, padding: "10px 8px", borderBottom: "1px solid #eee", alignItems: "center"},
    head: {background: "#f5f5f5", fontWeight: "bold"},

    delBtn: {padding: "6px 10px", background: "#b00020", color: "#fff", border: "none", borderRadius: 6, marginLeft: 8},
    editBtn: {padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6},

    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
    },
    modal: {background: "#fff", padding: 20, borderRadius: 8, width: 480},
    input: {padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6},
    textarea: {padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6},
    cancelBtn: {padding: "6px 10px", background: "#ccc", border: "none", borderRadius: 6},
    saveBtn: {padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6}
};
