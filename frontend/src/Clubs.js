// frontend/src/AdminClubs.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

export default function Clubs() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");

    // Edit modal state (admins only)
    const [showEdit, setShowEdit] = useState(false);
    const [editClub, setEditClub] = useState(null); // {id, name, description}

    const [category, setCategory] = useState("ALL");


    useEffect(() => {
        document.title = "Clubs Directory | InfCom";
        (async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/clubs");
                if (!res.ok) throw new Error(`Failed to load clubs (${res.status})`);
                const data = await res.json();
                const rows = (Array.isArray(data) ? data : (data.content || []))
                    .map(c => ({
                        id: c.id,
                        name: c.name ?? "",
                        description: c.description ?? "",
                        category: c.category ?? "OTHER"
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
    }, []);

    const filtered = useMemo(() => {
        const t = (q || "").toLowerCase();

        return clubs.filter(cl => {
            const matchesText =
                (cl.name || "").toLowerCase().includes(t) ||
                (cl.description || "").toLowerCase().includes(t) ||
                String(cl.id).includes(t);

            const matchesCategory =
                category === "ALL" || cl.category === category;

            return matchesText && matchesCategory;
        });
    }, [clubs, q, category]);


    // Admin actions
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
            setClubs(prev => prev.map(c => c.id === editClub.id ? { ...editClub } : c));
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

    return (
        <div style={styles.wrap}>
            <div style={styles.headerRow}>
                <h2>Clubs</h2>
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

                    <input
                        placeholder="Search by name/description/ID…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={styles.search}
                    />

                    <a href="#/" style={styles.backLink}>← Back</a>
                </div>

            </div>

            {loading && <p>Loading…</p>}
            {err && <p style={{color: "red"}}>{err}</p>}

            {!loading && !err && (
                <div style={styles.tableWrap}>
                    <div style={{...styles.row, ...styles.head}}>
                        <div style={{width: 80}}>ID</div>
                        <div style={{width: 120}}>Category</div>

                        <div style={{flex: 2}}>Name</div>
                        <div style={{flex: 4}}>Description</div>
                        {isAdmin && <div style={{width: 180, textAlign: "right"}}>Actions</div>}
                    </div>

                    {filtered.map((cl, idx) => (
                        <div key={cl.id} style={styles.row}>
                            <div style={{width: 80}}>{idx + 1}</div>
                            <div style={{width: 120}}>{cl.category}</div>


                            <div style={{flex: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                                <a href={`#/clubs/${cl.id}`} style={{textDecoration: "none"}}>{cl.name}</a>
                            </div>
                            <div style={{flex: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                                {cl.description}
                            </div>

                            {isAdmin && (
                                <div style={{width: 180, textAlign: "right"}}>
                                    <button style={styles.editBtn} onClick={() => openEdit(cl)}>Edit</button>
                                    <button style={styles.delBtn} onClick={() => deleteClub(cl)}>Delete</button>
                                </div>
                            )}
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div style={{ padding: "12px 8px" }}>No clubs found.</div>
                    )}
                </div>
            )}

            {/* EDIT MODAL (admins only) */}
            {isAdmin && showEdit && editClub && (
                <div style={styles.backdrop}>
                    <div style={styles.modal}>
                        <h3 style={{ marginTop: 0 }}>Edit Club</h3>
                        <form onSubmit={saveEdit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <input
                                name="name"
                                placeholder="Name"
                                value={editClub.name}
                                onChange={e => setEditClub(c => ({ ...c, name: e.target.value }))}
                                required
                                style={styles.input}
                            />
                            <textarea
                                name="description"
                                placeholder="Description"
                                value={editClub.description}
                                onChange={e => setEditClub(c => ({ ...c, description: e.target.value }))}
                                rows={6}
                                style={styles.textarea}
                            />
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                                <button type="button" onClick={() => { setShowEdit(false); setEditClub(null); }} style={styles.cancelBtn}>
                                    Cancel
                                </button>
                                <button type="submit" style={styles.saveBtn}>
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    wrap: { padding: 20, maxWidth: 1100, margin: "0 auto" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0, marginTop: 30 },
    search: { padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6, marginRight: 12 },
    backLink: { textDecoration: "none", border: "1px solid #ccc", padding: "6px 10px", borderRadius: 6, background: "#f8f8f8", color: "#333" },

    tableWrap: { background: "#fff", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" },
    row: { display: "flex", gap: 8, padding: "10px 8px", borderBottom: "1px solid #eee", alignItems: "center" },
    head: { background: "#f5f5f5", fontWeight: "bold" },

    delBtn: { padding: "6px 10px", background: "#b00020", color: "#fff", border: "none", borderRadius: 6, marginLeft: 8 },
    editBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6 },

    // modal
    backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modal: { background: "#fff", padding: 20, borderRadius: 8, width: 480, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
    input: { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 },
    textarea: { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 },
    cancelBtn: { padding: "6px 10px", background: "#ccc", color: "#000", border: "none", borderRadius: 6 },
    saveBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6 }
};
