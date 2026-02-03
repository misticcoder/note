// frontend/src/AdminThreads.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../AuthContext";
import "../styles/table.css";
import "../styles/Threads.css";
import Dropdown from "../components/Dropdown";
import { apiFetch } from "../api";

export default function ThreadList() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");

    // Edit modal state
    const [showEdit, setShowEdit] = useState(false);
    const [editThread, setEditThread] = useState(null);

    useEffect(() => {
        document.title = "Threads Directory | InfCom";

        (async () => {
            try {
                setLoading(true);
                const res = await apiFetch("/api/threads");
                if (!res.ok) {
                    throw new Error(`Failed to load threads (${res.status})`);
                }

                const data = await res.json();
                const rows = (Array.isArray(data) ? data : data?.content || []).map(t => ({
                    id: t.id,
                    title: t.title ?? "",
                    content: t.content ?? "",
                    author: t.author ?? "unknown",
                    published: t.published ?? t.createdAt ?? null
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
        const t = q.toLowerCase();
        return threads.filter(th =>
            th.title.toLowerCase().includes(t) ||
            th.content.toLowerCase().includes(t) ||
            String(th.id).includes(t)
        );
    }, [threads, q]);

    /* ================= ADMIN ACTIONS ================= */

    const openEdit = (th) => {
        if (!isAdmin) return;
        setEditThread({ ...th });
        setShowEdit(true);
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!isAdmin || !editThread) return;

        try {
            const res = await apiFetch(`/api/threads/${editThread.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editThread.title,
                    content: editThread.content
                })
            });

            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.message || "Update failed");
            }

            setThreads(prev =>
                prev.map(t =>
                    t.id === editThread.id ? { ...t, ...editThread } : t
                )
            );

            setShowEdit(false);
            setEditThread(null);
        } catch (e) {
            alert(e.message || "Update failed");
        }
    };

    const deleteThread = async (th) => {
        if (!isAdmin) return;
        if (!window.confirm(`Delete thread "${th.title}"?`)) return;

        try {
            const res = await apiFetch(`/api/threads/${th.id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || "Delete failed");
            }

            setThreads(prev => prev.filter(t => t.id !== th.id));
        } catch (e) {
            alert(e.message || "Delete failed");
        }
    };

    /* ================= RENDER ================= */

    return (
        <div className="page">
            <div className="container">
                <div className="table-wrap">
                    <div className="table-top">
                        <h2 className="title">Threads</h2>
                        <div>
                            <input
                                placeholder="Search by title/content/ID…"
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                className="search"
                            />
                            <a href="#/home" className="back-link">← Back</a>
                        </div>
                    </div>

                    {loading && <p>Loading…</p>}
                    {err && <p style={{ color: "red" }}>{err}</p>}

                    {!loading && !err && (
                        <div className="table">
                            <div className={`table-header ${isAdmin ? "admin" : "user"}`}>
                                <div>#</div>
                                <div>Title</div>
                                <div>Author</div>
                                <div>Content</div>
                                {isAdmin && <div style={{ textAlign: "right" }}>Actions</div>}
                            </div>

                            {filtered.map((th, i) => (
                                <div
                                    key={th.id}
                                    className={`table-row ${isAdmin ? "admin" : "user"}`}
                                    onClick={() =>
                                        (window.location.hash = `#/threads/${th.id}`)
                                    }
                                >
                                    <div className="rank">{i + 1}</div>
                                    <div>{th.title}</div>
                                    <div>{th.author}</div>
                                    <div>{th.content}</div>

                                    {isAdmin && (
                                        <div
                                            style={{ textAlign: "right" }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Dropdown
                                                onEdit={() => openEdit(th)}
                                                onDelete={() => deleteThread(th)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {filtered.length === 0 && (
                                <div style={{ padding: "12px 8px" }}>
                                    No threads found.
                                </div>
                            )}
                        </div>
                    )}

                    {isAdmin && showEdit && editThread && (
                        <div className="modal-backdrop">
                            <div className="modal-card">
                                <h3>Edit Thread</h3>
                                <form onSubmit={saveEdit} className="modal-form">
                                    <input
                                        value={editThread.title}
                                        onChange={e =>
                                            setEditThread(t => ({ ...t, title: e.target.value }))
                                        }
                                        required
                                    />
                                    <textarea
                                        value={editThread.content}
                                        onChange={e =>
                                            setEditThread(t => ({ ...t, content: e.target.value }))
                                        }
                                        rows={6}
                                    />
                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            className="cancelBtn"
                                            onClick={() => {
                                                setShowEdit(false);
                                                setEditThread(null);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="saveBtn">
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
