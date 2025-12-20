import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

export default function ThreadPage() {
    const { user } = useContext(AuthContext);
    const [thread, setThread] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [newComment, setNewComment] = useState("");
    const [threads, setThreads] = useState([]);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const hideThreads = windowWidth < 1000;
    const threadsWidth = "20%";
    const [hoveredId, setHoveredId] = useState(null);

    // extract id from hash: #/thread/123
    const threadId = (() => {
        const m = (window.location.hash || "").match(/^#\/thread\/(\d+)/i);
        return m ? Number(m[1]) : null;
    })();
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    useEffect(() => {
        const onResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);


    useEffect(() => {
        fetch("/api/threads")
            .then(r => r.json())
            .then(setThreads)
            .catch(() => setThreads([]));

        if (!threadId) return;
        (async () => {
            try {
                setLoading(true);
                const [tRes, cRes] = await Promise.all([
                    fetch(`/api/threads/${threadId}`),
                    fetch(`/api/threads/${threadId}/comments`)
                ]);
                if (!tRes.ok) throw new Error(`Thread not found (${tRes.status})`);
                const t = await tRes.json();
                const c = cRes.ok ? await cRes.json() : [];
                setThread(t);
                setComments(Array.isArray(c) ? c : []);
                setErr("");
            } catch (e) {
                console.error(e);
                setErr(e.message || "Failed to load thread");
            } finally {
                setLoading(false);
            }
        })();
    }, [threadId]);

    const postComment = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in to comment.");
            return;
        }
        const commentText = newComment.trim();
        if (!commentText) return;

        try {
            const res = await fetch(`/api/threads/${threadId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user.username,   // who posted (prototype)
                    comment: commentText       // <-- backend expects "comment"
                })
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `Failed to post comment (${res.status})`);
            }
            const saved = await res.json();
            setComments(prev => [...prev, saved]);
            setNewComment("");
        } catch (e) {
            alert(e.message || "Failed to post comment");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!user) {
            alert("You must be logged in.");
            return;
        }
        if (!window.confirm("Delete this comment?")) return;

        try {
            const url = `/api/threads/${threadId}/comments/${commentId}?requesterEmail=${encodeURIComponent(user.email)}`;
            const res = await fetch(url, { method: "DELETE" });
            const bodyText = await res.text(); // read text to avoid double-read
            if (!res.ok) {
                // try to parse JSON if present
                let msg = bodyText;
                try {
                    const json = JSON.parse(bodyText || "{}");
                    msg = json.message || bodyText || `HTTP ${res.status}`;
                } catch {}
                alert(`Delete failed (${res.status}): ${msg}`);
                return;
            }
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (e) {
            alert(e.message || "Delete failed");
        }
    };


    if (!threadId) {
        return (
            <div style={styles.wrap}>
                <p>Invalid thread link.</p>
                <a href="#/threads" style={styles.backLink}>← Back to Threads</a>
            </div>
        );
    }
    const boxHover = {
        transform: "translateY(-2px)",
        boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
        backgroundColor: "#f3f4f6"
    };

    return (
        <div style={styles.pageRow}>
            {!hideThreads && (
                <div style={{width: threadsWidth, display: "flex", flexDirection: "column"}}>

                    <h3 style={styles.col_title}>Threads</h3>
                    {isAdmin && (
                        <button style={styles.addBtn} onClick={() => setShowThreadModal(true)}>Add
                            Thread</button>
                    )}
                    {threads.map((thread, idx) => (
                        <div
                            key={thread.id}
                            style={{
                                ...styles.Threads,
                                ...(hoveredId === `thread-${thread.id}` ? boxHover : {})
                            }}
                            onMouseEnter={() => setHoveredId(`thread-${thread.id}`)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => {
                                window.location.hash = `#/thread/${thread.id}`;
                            }}
                        >
                            {thread.title}
                        </div>
                    ))}
                </div>
            )}

            <main style={styles.contentCol}>
                <div style={styles.headerRow}>
                    <a href="#/threads" style={styles.backLink}>← Back to Threads</a>
                </div>

                {loading && <p>Loading…</p>}
                {err && <p style={{ color: "red" }}>{err}</p>}

                {thread && (
                    <div style={styles.threadCard}>
                        <h2 style={{ marginTop: 0 }}>{thread.title}</h2>
                        <div style={styles.threadContent}>
                            {thread.content}
                        </div>
                    </div>
                )}

                {/* Comments */}
                <div style={styles.commentsCard}>
                    <h3 style={{ marginTop: 0 }}>Comments</h3>
                    {comments.length === 0 && <p>No comments yet.</p>}
                    <ul style={styles.commentList}>
                        {comments.map(c => {
                            const canDelete =
                                user &&
                                (String(user.role || "").toUpperCase() === "ADMIN" ||
                                    user.username === c.username);

                            return (
                                <li key={c.id} style={styles.commentItem}>
                                    <div style={styles.commentHeader}>
                                        <strong>{c.username}</strong>
                                        <span style={styles.commentTime}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                      </span>
                                    </div>
                                    <div>{c.comment}</div>

                                    {canDelete && (
                                        <div style={{ textAlign: "right", marginTop: 6 }}>
                                            <button
                                                onClick={() => handleDeleteComment(c.id)}
                                                style={styles.deleteBtn}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {/* Add comment (logged-in users) */}
                    <form onSubmit={postComment} style={styles.commentForm}>
              <textarea
                  placeholder={user ? "Write a comment…" : "Log in to comment"}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={3}
                  disabled={!user}
                  style={styles.textarea}
              />
                        <div style={{ textAlign: "right" }}>
                            <button type="submit" disabled={!user || !newComment.trim()} style={styles.postBtn}>
                                Post Comment
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

const boxBase = {
    border: "1px solid #ccc",
    padding: "10px 12px",
    marginBottom: "10px",
    borderRadius: "2px",
    cursor: "pointer",
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fff",
    transition: "transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
};

const styles = {
    wrap: { padding: 20, maxWidth: 900, margin: "0 auto" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    backLink: { textDecoration: "none", border: "1px solid #ccc", padding: "6px 10px", borderRadius: 6, background: "#f8f8f8", color: "#333" },

    threadCard: { background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 },
    threadContent: { whiteSpace: "pre-wrap", lineHeight: 1.5 },

    commentsCard: { background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 16 },
    commentList: { listStyle: "none", padding: 0, margin: "0 0 12px 0" },
    commentItem: { padding: "8px 0", borderBottom: "1px solid #eee" },
    commentHeader: { display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, color: "#555" },
    commentTime: { opacity: 0.8 },

    commentForm: { marginTop: 8 },
    textarea: { width: "100%", border: "1px solid #ccc", borderRadius: 6, padding: 8, resize: "vertical" },
    postBtn: { padding: "6px 12px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
    deleteBtn: { padding: "4px 8px", background: "#b00020", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
    // NEW
    pageRow: {
        display: "flex",
        gap: 24,
        maxWidth: 1200,
        margin: "0 auto",          // 🔑 THIS centers the layout
        padding: "60px 24px 24px",
        alignItems: "flex-start",
        boxSizing: "border-box"
    },

    // LEFT column
    threadListCol: {
        width: 260,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column"
    },

    // RIGHT column
    contentCol: {
        flex: 1,
        maxWidth: 900
    },
    col_title:{ textTransform: "uppercase",
        fontWeight: 700,
        fontSize: "15px",
        color: "#FFFFE3",
        paddingBottom: "5px",
        paddingLeft: "5px",
        paddingRight: "15px",
        display: "inline-block"},
    addBtn: { margin: "10px 0px", padding: "5px 8px", fontSize: "0.8rem", borderRadius: "4px", backgroundColor: "#041E42", color: "#D50032", border: "1px solid #D50032", cursor: "pointer", fontWeight: "Bold", textDecoration: "none", display: "inline-block" },
    Threads: { ...boxBase },
};
