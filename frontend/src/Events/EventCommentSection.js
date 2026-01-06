// src/Events/EventCommentSection.js
import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../AuthContext";
import CommentSection from "../CommentSection";
import ConfirmDialog from "../hooks/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";

import "../styles/comments.css";

export default function EventCommentSection({
                                                eventId,
                                                eventStatus,
                                                rsvp,
                                            }) {
    const { user } = useContext(AuthContext);

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    /* ===================== CONFIRM ===================== */

    const {
        confirmState,
        confirm,
        handleConfirm,
        handleCancel,
    } = useConfirm();

    /* ===================== FETCH COMMENTS ===================== */

    const fetchComments = useCallback(async () => {
        if (!eventId) return;

        const q = user?.username
            ? `?username=${encodeURIComponent(user.username)}`
            : "";

        const res = await fetch(`/api/events/${eventId}/comments${q}`);

        if (!res.ok) {
            setComments([]);
            return;
        }

        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
    }, [eventId, user?.username]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    /* ===================== POST COMMENT ===================== */

    const submitComment = async (e, parentId = null) => {
        e.preventDefault();
        if (!user) return;

        const text = newComment.trim();
        if (!text) return;

        try {
            const res = await fetch(
                `/api/events/${eventId}/comments`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: user.username,   // ✅ REQUIRED
                        comment: text,
                        parentId
                    })
                }
            );

            if (!res.ok) throw new Error();

            setNewComment("");
            fetchComments();
        } catch {
            alert("Failed to post comment");
        }
    };

    /* ===================== DELETE COMMENT ===================== */

    const deleteComment = async (commentId) => {
        await fetch(
            `/api/events/${eventId}/comments/${commentId}?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            { method: "DELETE" }
        );

        fetchComments();
    };

    const requestDelete = (commentId) => {
        confirm(commentId, async (id) => {
            await deleteComment(id);
        });
    };

    /* ===================== RENDER ===================== */

    return (
        <div className="comments-card-wrapper">
            <CommentSection
                comments={comments}
                user={user}
                newComment={newComment}
                setNewComment={setNewComment}
                onSubmit={submitComment}
                onDelete={requestDelete}
                refreshComments={fetchComments}
            />

            <ConfirmDialog
                open={confirmState.open}
                title="Delete Comment"
                message="Are you sure you want to delete this comment? This action cannot be undone."
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}
