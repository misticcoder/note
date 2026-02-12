// frontend/src/AdminClubs.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import "./styles/index.css";
import "./styles/modal.css";
import Dropdown from "./components/Dropdown";
import { apiFetch } from "./api";
import "./styles/clubs.css";

/* =========================
   SMALL UTIL: DEBOUNCE
========================= */
function useDebounced(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return debounced;
}

export default function Clubs() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [q, setQ] = useState("");
    const qDebounced = useDebounced(q);

    // Filters
    const [category, setCategory] = useState("ALL");
    const [sortBy, setSortBy] = useState("NAME_ASC");

    // Edit modal
    const [showEdit, setShowEdit] = useState(false);
    const [editClub, setEditClub] = useState(null);

    /* =========================
       FETCH CLUBS
    ========================= */
    useEffect(() => {
        document.title = "Clubs Directory | InfCom";

        (async () => {
            try {
                setLoading(true);

                const params = new URLSearchParams();
                if (category !== "ALL") params.set("category", category);
                if (sortBy && sortBy !== "EVENTS_DESC") params.set("sort", sortBy);

                const res = await apiFetch(`/api/clubs?${params.toString()}`);
                if (!res.ok) throw new Error(`Failed to load clubs (${res.status})`);

                const data = await res.json();

                setClubs(
                    (Array.isArray(data) ? data : []).map(c => ({
                        id: c.id,
                        name: c.name ?? "",
                        description: c.description ?? "",
                        category: c.category ?? "OTHER",
                        createdAt: c.createdAt ? new Date(c.createdAt) : null,
                        memberCount: c.memberCount ?? 0,
                        eventCount: c.eventCount ?? 0,
                        upcomingEventCount: c.upcomingEventCount ?? 0
                    }))
                );

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
       FILTER + SORT (CLIENT)
    ========================= */
    const filtered = useMemo(() => {
        const t = qDebounced.toLowerCase();

        let out = clubs.filter(cl =>
            cl.name.toLowerCase().includes(t) ||
            cl.description.toLowerCase().includes(t) ||
            String(cl.id).includes(t)
        );

        switch (sortBy) {
            case "NAME_DESC":
                out.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case "CREATED_NEW":
                out.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
                break;
            case "CREATED_OLD":
                out.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
                break;
            case "MEMBERS_DESC":
                out.sort((a, b) => b.memberCount - a.memberCount);
                break;
            case "EVENTS_DESC":
                out.sort((a, b) => b.eventCount - a.eventCount);
                break;
        }

        return out;
    }, [clubs, qDebounced, sortBy]);

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
            const res = await apiFetch(`/api/clubs/${editClub.id}`, {
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
                prev.map(c => (c.id === editClub.id ? { ...c, ...editClub } : c))
            );

            setShowEdit(false);
            setEditClub(null);
        } catch (e) {
            alert(e.message || "Update failed");
        }
    };

    const deleteClub = async (cl) => {
        if (!isAdmin) return;
        if (!window.confirm(`Delete club "${cl.name}"? This cannot be undone.`)) return;

        try {
            const res = await apiFetch(`/api/clubs/${cl.id}`, { method: "DELETE" });
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
        <div className="page">
            <div className="container">
                <div className="table-wrap">
                    <div className="events-top">
                        <h2>Clubs</h2>

                        <div className={"events-controls"}>
                            <select className={"sort-select"} value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="ALL">All categories</option>
                                <option value="SPORTS">Sports</option>
                                <option value="ACADEMIC">Academic</option>
                                <option value="SOCIETY">Society</option>
                                <option value="FAMILY">Family</option>
                                <option value="SOCIAL">Social</option>
                                <option value="OTHER">Other</option>
                            </select>

                            <select className={"sort-select"} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="NAME_ASC">Name (A–Z)</option>
                                <option value="NAME_DESC">Name (Z–A)</option>
                                <option value="CREATED_NEW">Newest first</option>
                                <option value="CREATED_OLD">Oldest first</option>
                                <option value="MEMBERS_DESC">Most members</option>
                                <option value="EVENTS_DESC">Most events</option>
                            </select>

                            <input
                                className={"search-input"}
                                placeholder="Search by name / description / ID…"
                                value={q}
                                onChange={e => setQ(e.target.value)}
                            />

                            <a href="#/home" className="back-link">← Back</a>
                        </div>
                    </div>

                    {loading && <p>Loading…</p>}
                    {err && <p className="error">{err}</p>}

                    {!loading && !err && (
                        <div className="clubs-table">
                            <div className="clubs-header">
                                <div>#</div>
                                <div>Category</div>
                                <div>Name</div>
                                <div>Members</div>
                                <div>Events</div>
                                <div>Upcoming</div>
                                {isAdmin && <div>Actions</div>}
                            </div>

                            {filtered.map((cl, idx) => (
                                <div key={cl.id} className="clubs-row">
                                    <div className="rank">{idx + 1}</div>
                                    <div >{cl.category}</div>
                                    <div>
                                        <a href={`#/clubs/${cl.id}`}>{cl.name}</a>
                                    </div>
                                    <div>
                                        {cl.memberCount
                                            ? <span className="rating-count">{cl.memberCount}</span>
                                            : <span className="muted">No members</span>}
                                    </div>
                                    <div>
                                        {cl.eventCount
                                            ? <span className="rating-count">{cl.eventCount}</span>
                                            : <span className="muted">No events</span>}
                                    </div>
                                    <div>
                                        {cl.upcomingEventCount
                                            ? <span className="rating-count">{cl.upcomingEventCount}</span>
                                            : <span className="muted">None</span>}
                                    </div>

                                    {isAdmin && (
                                        <div className="actions">
                                            <Dropdown
                                                onEdit={() => openEdit(cl)}
                                                onDelete={() => deleteClub(cl)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {filtered.length === 0 && (
                                <div className="empty-row">No clubs found.</div>
                            )}
                        </div>
                    )}

                    {isAdmin && showEdit && editClub && (
                        <div className="modal-backdrop">
                            <div className="modal-card">
                                <h3>Edit Club</h3>
                                <form onSubmit={saveEdit} className="modal-form">
                                    <input
                                        value={editClub.name}
                                        onChange={e =>
                                            setEditClub(c => ({ ...c, name: e.target.value }))
                                        }
                                        required
                                    />
                                    <textarea
                                        value={editClub.description}
                                        onChange={e =>
                                            setEditClub(c => ({ ...c, description: e.target.value }))
                                        }
                                        rows={6}
                                    />
                                    <div className="modal-actions">
                                        <button type="button" onClick={() => setShowEdit(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit">Save</button>
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
