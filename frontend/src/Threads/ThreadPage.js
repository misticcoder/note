import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../AuthContext";
import ThreadSection from "./ThreadSection";
import CommentSection from "../CommentSection";
import "../styles/Threads.css";

export default function ThreadPage() {
    const { user } = useContext(AuthContext);

    const [thread, setThread] = useState(null);
    const [threads, setThreads] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // extract id from hash: #/thread/123
    const threadId = (() => {
        const m = (window.location.hash || "").match(/^#\/thread\/(\d+)/i);
        return m ? Number(m[1]) : null;
    })();

    const role = String(user?.role || "").toUpperCase();
    const isAdmin = role === "ADMIN";

    useEffect(() => {
        if (thread?.title) {
            document.title = `${thread.title} | InfCom`;
        } else {
            document.title = "InfCom";
        }
    }, [thread]);

    /* SideBar Thread List */

    useEffect(() => {
        const controller = new AbortController();

        fetch("/api/threads", { signal: controller.signal })
            .then(r => r.json())
            .then(data => setThreads(Array.isArray(data) ? data : []))
            .catch(() => setThreads([]));

        return () => controller.abort();
    }, []);

    /* Fetch Comments */

    const fetchComments = useCallback(
        async (signal) => {
            if (!threadId) return;

            const usernameParam = user?.username
                ? `?username=${encodeURIComponent(user.username)}`
                : "";

            const res = await fetch(
                `/api/threads/${threadId}/comments${usernameParam}`,
                { signal }
            );

            if (!res.ok) {
                throw new Error(`Failed to load comments (${res.status})`);
            }

            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        },
        [threadId, user?.username]
    );

    /* Fetch thread + comments */

    useEffect(() => {
        if (!threadId) return;

        const controller = new AbortController();

        (async () => {
            try {
                setLoading(true);

                const tRes = await fetch(
                    `/api/threads/${threadId}`,
                    { signal: controller.signal }
                );

                if (!tRes.ok) {
                    throw new Error(`Thread not found (${tRes.status})`);
                }

                const t = await tRes.json();
                setThread(t);

                await fetchComments(controller.signal);
                setErr("");
            } catch (e) {
                if (e.name !== "AbortError") {
                    console.error(e);
                    setErr(e.message || "Failed to load thread");
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [threadId, fetchComments]);

    /* Post Comments */

    const postComment = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in to comment.");
            return;
        }

        const text = newComment.trim();
        if (!text) return;

        try {
            const res = await fetch(`/api/threads/${threadId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user.username,
                    comment: text
                })
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(
                    body.message || `Failed to post comment (${res.status})`
                );
            }

            setNewComment("");
            await fetchComments();
        } catch (e) {
            alert(e.message || "Failed to post comment");
        }
    };

    /* Delete Comments */

    const handleDeleteComment = async (commentId) => {
        if (!user) {
            alert("You must be logged in.");
            return;
        }
        if (!window.confirm("Delete this comment?")) return;

        try {
            const res = await fetch(
                `/api/threads/${threadId}/comments/${commentId}?requesterEmail=${encodeURIComponent(
                    user.email
                )}`,
                { method: "DELETE" }
            );

            const bodyText = await res.text();

            if (!res.ok) {
                let msg = bodyText;
                try {
                    const json = JSON.parse(bodyText || "{}");
                    msg = json.message || bodyText || `HTTP ${res.status}`;
                } catch {}
                alert(`Delete failed (${res.status}): ${msg}`);
                return;
            }

            await fetchComments();
        } catch (e) {
            alert(e.message || "Delete failed");
        }
    };

    /* Thread Guard */

    if (!threadId) {
        return (
            <div className="wrap">
                <p>Invalid thread link.</p>
                <a href="#/threads" className="back-link">
                    ← Back to Threads
                </a>
            </div>
        );
    }

    return (
        <div className="page-row">
            <aside className="thread-sidebar">
                <ThreadSection
                    title="Threads"
                    threads={threads}
                    showAddButton={isAdmin}
                />
            </aside>

            <main className="content-col">
                <div className="header-row">
                    <a href="#/threads" className="back-link">
                        ← Back to Threads
                    </a>
                </div>

                {loading && <p>Loading…</p>}
                {err && <p style={{ color: "red" }}>{err}</p>}

                {thread && (
                    <div className="thread-card">
                        <h2 className="thread-title">{thread.title}</h2>

                        <div className="thread-meta">
                            <span>
                                Posted by <strong>{thread.author}</strong>
                            </span>
                            <span className="thread-meta-sep">•</span>
                            <span>
                                {thread.published &&
                                    new Date(
                                        thread.published
                                    ).toLocaleString()}
                            </span>
                        </div>

                        <div className="thread-content">
                            {thread.content}
                        </div>
                    </div>
                )}

                <CommentSection
                    comments={comments}
                    user={user}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    onSubmit={postComment}
                    onDelete={handleDeleteComment}
                    refreshComments={fetchComments}
                />
            </main>
        </div>
    );
}
