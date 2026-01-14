import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../AuthContext";
import ThreadSection from "./ThreadSection";
import CommentSection from "../CommentSection";
import ConfirmDialog from "../hooks/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import "../styles/Threads.css";
import "../styles/buttons.css";

export default function ThreadPage() {
    const { user } = useContext(AuthContext);

    const [thread, setThread] = useState(null);
    const [threads, setThreads] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    /* ===================== CONFIRM HOOK ===================== */

    const {
        confirmState,
        confirm,
        handleConfirm,
        handleCancel,
    } = useConfirm();

    /* ===================== THREAD ID ===================== */

    const threadId = (() => {
        const m = (window.location.hash || "").match(/^#\/threads\/(\d+)/i);
        return m ? Number(m[1]) : null;
    })();

    const role = String(user?.role || "").toUpperCase();
    const isAdmin = role === "ADMIN";

    useEffect(() => {
        document.title = thread?.title
            ? `${thread.title} | InfCom`
            : "InfCom";
    }, [thread]);

    /* ===================== SIDEBAR THREAD LIST ===================== */

    useEffect(() => {
        const controller = new AbortController();

        fetch("/api/threads", { signal: controller.signal })
            .then(r => r.json())
            .then(data => setThreads(Array.isArray(data) ? data : []))
            .catch(() => setThreads([]));

        return () => controller.abort();
    }, []);

    /* ===================== FETCH COMMENTS ===================== */

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

    /* ===================== FETCH THREAD + COMMENTS ===================== */

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

    /* ===================== POST COMMENT ===================== */

    const postComment = async (e, parentId = null) => {
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
                    comment: text,
                    parentId,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(
                    body.message || `Failed to post comment (${res.status})`
                );
            }

            setNewComment("");
            fetchComments();
        } catch (e) {
            alert(e.message || "Failed to post comment");
        }
    };

    /* ===================== DELETE COMMENT (CONFIRMED) ===================== */

    const requestDeleteComment = (commentId) => {
        if (!user) {
            alert("You must be logged in.");
            return;
        }

        confirm(commentId, async (id) => {
            const res = await fetch(
                `/api/threads/${threadId}/comments/${id}?requesterEmail=${encodeURIComponent(
                    user.email
                )}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Delete failed");
            }

            fetchComments();
        });
    };

    /* ===================== GUARD ===================== */

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

    /* ===================== RENDER ===================== */

    return (
        <div className={"page"}>
            <div className={"container"}>
                <div className="table-wrap">
                    <div className={"table-top"}>
                        <h2 className={"title"}>Thread</h2>
                        <div>
                            <a href="#/home" className={"back-link"}>← Back</a>
                        </div>
                    </div>
                    <div className={"page-row"}>
                        <aside className="thread-sidebar">
                            <ThreadSection
                                threads={threads}
                                showAddButton={isAdmin}
                            />
                        </aside>

                        <main className="content-col">

                            {loading && <p>Loading…</p>}
                            {err && <p style={{color: "red"}}>{err}</p>}

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
                                onDelete={requestDeleteComment}
                                refreshComments={fetchComments}
                            />
                        </main>
                    </div>

                    {/* ===================== CONFIRM DIALOG ===================== */}

                    <ConfirmDialog
                        open={confirmState.open}
                        title="Delete Comment"
                        message="Are you sure you want to delete this comment? This action cannot be undone."
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
        </div>
    );
}
