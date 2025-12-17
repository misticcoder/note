import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

export default function NewsPage() {
    const { user } = useContext(AuthContext);
    const [news, setNews] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [newComment, setNewComment] = useState("");

    // extract id from hash: #/news/123
    const newsId = (() => {
        const m = (window.location.hash || "").match(/^#\/news\/(\d+)/i);
        return m ? Number(m[1]) : null;
    })();

    useEffect(() => {
        if (!newsId) return;
        (async () => {
            try {
                setLoading(true);
                const [tRes, cRes] = await Promise.all([
                    fetch(`/api/news/${newsId}`),
                    fetch(`/api/news/${newsId}/comments`)
                ]);
                if (!tRes.ok) throw new Error(`News not found (${tRes.status})`);
                const t = await tRes.json();
                const c = cRes.ok ? await cRes.json() : [];
                setNews(t);
                setComments(Array.isArray(c) ? c : []);
                setErr("");
            } catch (e) {
                console.error(e);
                setErr(e.message || "Failed to load News");
            } finally {
                setLoading(false);
            }
        })();
    }, [newsId]);

    const postComment = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in to comment.");
            return;
        }
        const commentText = newComment.trim();
        if (!commentText) return;

        try {
            const res = await fetch(`/api/news/${newsId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user.name,   // who posted (prototype)
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
            const url = `/api/news/${newsId}/comments/${commentId}?requesterEmail=${encodeURIComponent(user.email)}`;
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

    if (!newsId) {
        return (
            <div style={styles.wrap}>
                <p>Invalid News link.</p>
                <a href="#/news" style={styles.backLink}>← Back to News</a>
            </div>
        );
    }

    return (
        <div style={styles.wrap}>
            <div style={styles.headerRow}>
                <a href="#/news" style={styles.backLink}>← Back to News</a>
            </div>

            {loading && <p>Loading…</p>}
            {err && <p style={{ color: "red" }}>{err}</p>}

            {news && (
                <div style={styles.threadCard}>
                    <h2 style={{ marginTop: 0 }}>{news.title}</h2>
                    <div style={styles.threadContent}>
                        {news.content}
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
        </div>
    );
}

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
    deleteBtn: { padding: "4px 8px", background: "#b00020", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }
};
