// src/Events/EventCommentSection.jsx

import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../AuthContext";
import CommentSection from "../CommentSection";

export default function EventCommentSection({
                                                eventId,
                                                eventStatus,
                                                rsvp,
                                            }) {
    const { user } = useContext(AuthContext);

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    /* =====================
       PERMISSIONS
    ===================== */

    const canComment =
        !!user &&
        rsvp === "GOING" &&
        eventStatus === "ENDED";

    /* =====================
       FETCH COMMENTS
    ===================== */

    const fetchComments = useCallback(async () => {
        if (!eventId) return;

        try {
            setLoading(true);

            const res = await fetch(
                `/api/events/${eventId}/comments`
            );

            if (!res.ok) {
                setComments([]);
                return;
            }

            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    /* =====================
       POST COMMENT
    ===================== */

    const postComment = async (e, parentId = null) => {
        e.preventDefault();
        if (!canComment) return;

        const text = newComment.trim();
        if (!text) return;

        try {
            const res = await fetch(
                `/api/events/${eventId}/comments?requesterEmail=${encodeURIComponent(
                    user.email
                )}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        comment: text,
                        parentId,
                    }),
                }
            );

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || "Failed to post comment");
            }

            setNewComment("");
            fetchComments();
        } catch (e) {
            alert(e.message || "Failed to post comment");
        }
    };

    /* =====================
       DELETE COMMENT
    ===================== */

    const deleteComment = async (commentId) => {
        if (!user) return;

        if (!window.confirm("Delete this comment?")) return;

        await fetch(
            `/api/events/${eventId}/comments/${commentId}?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            { method: "DELETE" }
        );

        fetchComments();
    };

    /* =====================
       RENDER GUARDS
    ===================== */

    if (loading) {
        return <div className="muted">Loading reviews…</div>;
    }

    return (
        <div style={{ marginTop: 16 }}>
            {/* =====================
               RULE MESSAGES
            ===================== */}

            {!user && (
                <div className="muted" style={{ marginBottom: 8 }}>
                    Log in to view and write reviews.
                </div>
            )}

            {user && rsvp !== "GOING" && (
                <div className="muted" style={{ marginBottom: 8 }}>
                    Only attendees marked as <strong>Going</strong> can review this event.
                </div>
            )}

            {user && rsvp === "GOING" && eventStatus !== "ENDED" && (
                <div className="muted" style={{ marginBottom: 8 }}>
                    Reviews open after the event ends.
                </div>
            )}

            {/* =====================
               COMMENT SECTION
            ===================== */}

            <CommentSection
                comments={comments}
                user={user}
                newComment={newComment}
                setNewComment={setNewComment}
                onSubmit={postComment}
                onDelete={deleteComment}
                refreshComments={fetchComments}
            />

            {!canComment && (
                <div className="muted" style={{ marginTop: 6 }}>
                    You cannot post a review at this time.
                </div>
            )}
        </div>
    );
}
