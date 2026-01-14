// frontend/src/AdminThreads.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../AuthContext";
import "../styles/table.css";
import "../styles/Threads.css";
import Dropdown from "../components/Dropdown";
import {timeAgo} from "../components/timeAgo";

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
        document.title = "Threads Directory | InfCom";
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
                        published: t.published ?? t.published?? "TBA",
                        author: t.author ?? t.author?? "unknown",
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
        <div className={"page"}>
            <div className={"container"}>
                <div className={"table-wrap"}>
                    <div className={"table-top"}>
                        <h2 className={"title"}>Threads</h2>
                        <div>
                            <input
                                placeholder="Search by title/content/ID…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className={"search"}
                            />
                            <a href="#/home" className={"back-link"}>← Back</a>
                        </div>
                    </div>

                    {loading && <p>Loading…</p>}
                    {err && <p style={{color: "red"}}>{err}</p>}

                    {!loading && !err && (
                        <div className={"table"}>
                            <div className={`table-header ${isAdmin ? "admin" : "user"}`}>
                                <div>ID</div>
                                <div>Title</div>
                                <div>Author</div>
                                <div>Content</div>
                                {isAdmin && <div style={{textAlign: "right"}}>Actions</div>}
                            </div>


                            {filtered.map((th, i) => (
                                <div
                                    key={th.id}
                                    className={`table-row ${isAdmin ? "admin" : "user"}`}
                                    onClick={() =>
                                        (window.location.hash = `#/threads/${th.id}`)
                                    }
                                >
                                    <div className={"rank"}>{i + 1}</div>

                                    <div className="event-main">
                                        <div className="event-title">{th.title}</div>

                                        <div className="event-meta">
                                            {th.published
                                                ? new Date(th.published).toLocaleString()
                                                : "TBA"}
                                        </div>

                                    </div>

                                    <div className="row-meta">
                                        {th.author && ` by ${th.author}`}
                                    </div>

                                    <div>{th.content}</div>

                                    {isAdmin && (
                                        <div style={{textAlign: "right"}}>
                                            <Dropdown
                                                onEdit={() => openEdit(th)}
                                                onDelete={() => deleteThread(th)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}


                            {filtered.length === 0 && (
                                <div style={{padding: "12px 8px"}}>No threads found.</div>
                            )}
                        </div>
                    )}

                    {/* EDIT MODAL (admins only) */}
                    {isAdmin && showEdit && editThread && (
                        <div className={styles.backdrop}>
                            <div style={styles.modal}>
                                <h3 style={{marginTop: 0}}>Edit Thread</h3>
                                <form onSubmit={saveEdit} style={{display: "flex", flexDirection: "column", gap: 10}}>
                                    <input
                                        name="title"
                                        placeholder="Title"
                                        value={editThread.title}
                                        onChange={e => setEditThread(t => ({...t, title: e.target.value}))}
                                        required
                                        style={styles.input}
                                    />
                                    <textarea
                                        name="content"
                                        placeholder="Content"
                                        value={editThread.content}
                                        onChange={e => setEditThread(t => ({...t, content: e.target.value}))}
                                        rows={6}
                                        style={styles.textarea}
                                    />
                                    <div style={{display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6}}>
                                        <button type="button" onClick={() => {
                                            setShowEdit(false);
                                            setEditThread(null);
                                        }} style={styles.cancelBtn}>
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
            </div>
        </div>
    );
}

const styles = {

    tableWrap: {background: "#fff", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden"},
    row: {display: "flex", gap: 8, padding: "10px 8px", borderBottom: "1px solid #eee", alignItems: "center"},
    head: {background: "#f5f5f5", fontWeight: "bold"},

    delBtn: {padding: "6px 10px", background: "#b00020", color: "#fff", border: "none", borderRadius: 6, marginLeft: 8},
    editBtn: {padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6},

    // modal
    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
    },
    modal: {background: "#fff", padding: 20, borderRadius: 8, width: 480, boxShadow: "0 10px 30px rgba(0,0,0,0.2)"},
    input: {padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6},
    textarea: {padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6},
    cancelBtn: {padding: "6px 10px", background: "#ccc", color: "#000", border: "none", borderRadius: 6},
    saveBtn: {padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6}
};
