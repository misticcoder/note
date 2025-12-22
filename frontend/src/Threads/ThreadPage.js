import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext";
import ThreadSection from "./ThreadSection";
import "../styles/Threads.css";


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
            <div className="wrap">
                <p>Invalid thread link.</p>
                <a href="#/threads" className="back-link">← Back to Threads</a>
            </div>
        );
    }
    const boxHover = {
        transform: "translateY(-2px)",
        boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
        backgroundColor: "#f3f4f6"
    };

    return (
        <div className={"page-row"}>
            {!hideThreads && (
                <ThreadSection
                    title="Threads"
                    width={threadsWidth}
                    showAddButton={isAdmin}
                />
            )}

            <main className={"content-col"}>
                <div className={"header-row"}>
                    <a href="#/threads" className={"back-link"}>← Back to Threads</a>
                </div>

                {loading && <p>Loading…</p>}
                {err && <p style={{ color: "red" }}>{err}</p>}

                {thread && (
                    <div className={"thread-card"}>
                        <h2 style={{ marginTop: 0 }}>{thread.title}</h2>
                        <div className={"thread-content"}>
                            {thread.content}
                        </div>
                    </div>
                )}

                {/* Comments */}
                <div className={"comments-card"}>
                    <h3 style={{ marginTop: 0 }}>Comments</h3>
                    {comments.length === 0 && <p>No comments yet.</p>}
                    <ul className={"comment-list"}>
                        {comments.map(c => {
                            const canDelete =
                                user &&
                                (String(user.role || "").toUpperCase() === "ADMIN" ||
                                    user.username === c.username);

                            return (
                                <li key={c.id} className={"comment-item"}>
                                    <div className={"comment-header"}>
                                        <strong>{c.username}</strong>
                                        <span className={"comment-time"}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                      </span>
                                    </div>
                                    <div>{c.comment}</div>

                                    {canDelete && (
                                        <div style={{ textAlign: "right", marginTop: 6 }}>
                                            <button
                                                onClick={() => handleDeleteComment(c.id)}
                                                className={"delete-btn"}
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
                    <form onSubmit={postComment} className={"comment-form"}>
              <textarea
                  placeholder={user ? "Write a comment…" : "Log in to comment"}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={3}
                  disabled={!user}
                  className={"textarea"}
              />
                        <div style={{ textAlign: "right" }}>
                            <button type="submit" disabled={!user || !newComment.trim()} className={"post-btn"}>
                                Post Comment
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}


