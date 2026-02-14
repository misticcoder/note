// frontend/src/components/ThreadPage.js
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../AuthContext";
import ThreadSection from "./ThreadSection";
import CommentSection from "../CommentSection";
import ConfirmDialog from "../hooks/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import Dropdown from "../components/Dropdown";  // ✅ Import Dropdown
import "../styles/Threads.css";
import "../styles/buttons.css";
import "../styles/index.css";
import { apiFetch } from "../api";

export default function ThreadPage() {
    const { user } = useContext(AuthContext);

    const [thread, setThread] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");

    const role = String(user?.role || "").toUpperCase();
    const isAdmin = role === "ADMIN";

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

    /* ===================== PERMISSION CHECK ===================== */
    // User can edit if they're admin OR author
    const canEdit = thread && user && (isAdmin || thread.author === user.username);

    /* ===================== DOCUMENT TITLE ===================== */

    useEffect(() => {
        document.title = thread?.title
            ? `${thread.title} | InfCom`
            : "InfCom";
    }, [thread]);

    /* ===================== FETCH COMMENTS ===================== */

    const fetchComments = useCallback(
        async (signal) => {
            if (!threadId) return;

            const usernameParam = user?.username
                ? `?username=${encodeURIComponent(user.username)}`
                : "";

            const res = await apiFetch(
                `/api/threads/${threadId}/comments${usernameParam}`,
                signal ? { signal } : undefined
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
                setErr("");

                const tRes = await apiFetch(
                    `/api/threads/${threadId}`,
                    { signal: controller.signal }
                );

                if (!tRes.ok) {
                    throw new Error(`Thread not found (${tRes.status})`);
                }

                const t = await tRes.json();
                setThread(t);

                await fetchComments(controller.signal);
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

    /* ===================== EDIT THREAD ===================== */

    const openEditModal = () => {
        if (!canEdit) return;
        setEditTitle(thread.title);
        setEditContent(thread.content);
        setShowEditModal(true);
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!canEdit) return;

        try {
            const res = await apiFetch(
                `/api/threads/${threadId}?requesterEmail=${encodeURIComponent(user.email)}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: editTitle,
                        content: editContent
                    })
                }
            );

            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.message || "Update failed");
            }

            // Update local state
            setThread(prev => ({
                ...prev,
                title: editTitle,
                content: editContent
            }));

            setShowEditModal(false);
        } catch (e) {
            alert(e.message || "Failed to update thread");
        }
    };

    /* ===================== DELETE THREAD ===================== */

    const requestDeleteThread = () => {
        if (!canEdit) return;

        confirm(null, async () => {
            try {
                const res = await apiFetch(
                    `/api/threads/${threadId}?requesterEmail=${encodeURIComponent(user.email)}`,
                    {
                        method: "DELETE"
                    }
                );

                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.message || "Delete failed");
                }

                // Redirect back to threads list
                window.location.hash = "#/threads";
            } catch (e) {
                alert(e.message || "Failed to delete thread");
            }
        });
    };

    /* ===================== POST COMMENT ===================== */

    const postComment = async (e, parentId = null) => {
        e.preventDefault();

        if (!user) {
            alert("You must be logged in to comment.");
            return;
        }

        if (!user.username) {
            alert("User profile is incomplete. Please update your profile.");
            return;
        }

        const text = newComment.trim();
        if (!text) return;

        try {
            const res = await apiFetch(
                `/api/threads/${threadId}/comments`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: user.username,
                        comment: text,
                        parentId,
                    }),
                }
            );

            const body = await res.json().catch(() => ({}));

            if (!res.ok) {
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
            try {
                const res = await apiFetch(
                    `/api/threads/${threadId}/comments/${id}`,
                    {
                        method: "DELETE",
                        headers: {
                            "X-User-Email": user.email
                        }
                    }
                );

                if (!res.ok) {
                    const msg = await res.text();
                    throw new Error(msg || "Delete failed");
                }

                fetchComments();
            } catch (e) {
                alert(e.message || "Failed to delete comment");
            }
        });
    };

    /* ===================== INVALID THREAD ===================== */

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
        <div className="page">
            <div className="container">
                <div className="table-wrap">
                    <div className="table-top">
                        <a href="#/home" className="back-link">
                            ← Back
                        </a>
                    </div>

                    <div className="page-row">
                        {/* SIDEBAR */}
                        <aside className="thread-sidebar">
                            <ThreadSection showAddButton={isAdmin} />
                        </aside>

                        {/* MAIN CONTENT */}
                        <div className="content-col">
                            {loading && <p>Loading…</p>}
                            {err && <p style={{ color: "red" }}>{err}</p>}

                            {thread && (
                                <div className="thread-card">
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "start",
                                        marginBottom: "12px"
                                    }}>
                                        <h2 className="thread-title" style={{ margin: 0 }}>
                                            {thread.title}
                                        </h2>

                                        {/* ✅ DROPDOWN for admin or author */}
                                        {canEdit && (
                                            <Dropdown
                                                onEdit={openEditModal}
                                                onDelete={requestDeleteThread}
                                            />
                                        )}
                                    </div>

                                    <div className="thread-meta">
                                        <span>
                                            Posted by{" "}
                                            <strong>{thread.author}</strong>
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
                        </div>
                    </div>

                    {/* EDIT MODAL */}
                    {showEditModal && (
                        <div className="modal-backdrop">
                            <div className="modal-card">
                                <h3>Edit Thread</h3>
                                <form onSubmit={saveEdit} className="modal-form">
                                    <label>
                                        Title
                                        <input
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            required
                                        />
                                    </label>
                                    <label>
                                        Content
                                        <textarea
                                            value={editContent}
                                            onChange={e => setEditContent(e.target.value)}
                                            rows={6}
                                        />
                                    </label>
                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            className="cancelBtn"
                                            onClick={() => setShowEditModal(false)}
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

                    {/* CONFIRM DIALOG */}
                    <ConfirmDialog
                        open={confirmState.open}
                        title={confirmState.data === null ? "Delete Thread" : "Delete Comment"}
                        message={
                            confirmState.data === null
                                ? "Are you sure you want to delete this thread? This action cannot be undone."
                                : "Are you sure you want to delete this comment? This action cannot be undone."
                        }
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
        </div>
    );
}