// frontend/src/AdminThreads.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

export default function ThreadList() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");

    // Edit modal state (admins only)
    const [showEdit, setShowEdit] = useState(false);
    const [editThread, setEditThread] = useState(null); // {id, title, content}

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/threads");
                if (!res.ok) throw new Error(`Failed to load threads (${res.status})`);
                const data = await res.json();
                const rows = (Array.isArray(data) ? data : (data.content || []))
                    .map(t => ({
                        id: t.id,
                        title: t.title ?? t.name ?? "",
                        content: t.content ?? t.body ?? ""
                    }));
                setThreads(rows);
                setErr("");
            } catch (e) {
                console.error(e);
                setErr(e.message || "Failed to load threads");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const t = (q || "").toLowerCase();
        return threads.filter(th =>
            (th.title || "").toLowerCase().includes(t) ||
            (th.content || "").toLowerCase().includes(t) ||
            String(th.id).includes(t)
        );
    }, [threads, q]);

    // Admin actions
    const openEdit = (th) => {
        if (!isAdmin) return;
        setEditThread({ ...th });
        setShowEdit(true);
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!isAdmin || !editThread) return;
        try {
            const res = await fetch(`/api/threads/${editThread.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editThread.title,
                    content: editThread.content
                })
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `Update failed (${res.status})`);
            }
            setThreads(prev => prev.map(t => t.id === editThread.id ? { ...editThread } : t));
            setShowEdit(false);
            setEditThread(null);
            alert("Thread updated");
        } catch (e) {
            alert(e.message || "Update failed");
        }
    };

    const deleteThread = async (th) => {
        if (!isAdmin) return;
        if (!window.confirm(`Delete thread "${th.title}"?`)) return;
        try {
            const res = await fetch(`/api/threads/${th.id}`, { method: "DELETE" });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `Delete failed (${res.status})`);
            }
            setThreads(prev => prev.filter(t => t.id !== th.id));
        } catch (e) {
            alert(e.message || "Delete failed");
        }
    };

    return (
        <div style={styles.wrap}>
            <div style={styles.headerRow}>
                <h2 >Threads</h2>
                <div>
                    <input
                        placeholder="Search by title/content/ID…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={styles.search}
                    />
                    <a href="#/" style={styles.backLink}>← Back</a>
                </div>
            </div>

            {loading && <p>Loading…</p>}
            {err && <p style={{ color: "red" }}>{err}</p>}

            {!loading && !err && (
                <div style={styles.tableWrap}>
                    <div style={{ ...styles.row, ...styles.head }}>
                        <div style={{ width: 80 }}>ID</div>
                        <div style={{ flex: 2 }}>Title</div>
                        <div style={{ flex: 4 }}>Content</div>
                        {isAdmin && <div style={{ width: 180, textAlign: "right" }}>Actions</div>}
                    </div>

                    {filtered.map((th) => (
                        <div key={th.id} style={styles.row}>
                            <div style={{ width: 80 }}>{th.id}</div>
                            <div style={{ flex: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <a href={`#/thread/${th.id}`} style={{ textDecoration: "none" }}>{th.title}</a>
                            </div>
                            <div style={{ flex: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {th.content}
                            </div>

                            {isAdmin && (
                                <div style={{ width: 180, textAlign: "right" }}>
                                    <button style={styles.editBtn} onClick={() => openEdit(th)}>Edit</button>
                                    <button style={styles.delBtn} onClick={() => deleteThread(th)}>Delete</button>
                                </div>
                            )}
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div style={{ padding: "12px 8px" }}>No threads found.</div>
                    )}
                </div>
            )}

            {/* EDIT MODAL (admins only) */}
            {isAdmin && showEdit && editThread && (
                <div style={styles.backdrop}>
                    <div style={styles.modal}>
                        <h3 style={{ marginTop: 0 }}>Edit Thread</h3>
                        <form onSubmit={saveEdit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <input
                                name="title"
                                placeholder="Title"
                                value={editThread.title}
                                onChange={e => setEditThread(t => ({ ...t, title: e.target.value }))}
                                required
                                style={styles.input}
                            />
                            <textarea
                                name="content"
                                placeholder="Content"
                                value={editThread.content}
                                onChange={e => setEditThread(t => ({ ...t, content: e.target.value }))}
                                rows={6}
                                style={styles.textarea}
                            />
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                                <button type="button" onClick={() => { setShowEdit(false); setEditThread(null); }} style={styles.cancelBtn}>
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
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0, marginTop: 30},
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
