// src/Events/EventCommentSection.js
import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../AuthContext";
import CommentSection from "../CommentSection";
import ConfirmDialog from "../hooks/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";

export default function EventCommentSection({ eventId }) {
    const { user } = useContext(AuthContext);

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

    /* ===================== FETCH ===================== */
    const fetchComments = useCallback(async () => {
        if (!eventId) return;

        const q = user?.username
            ? `?username=${encodeURIComponent(user.username)}`
            : "";

        const res = await fetch(`/api/events/${eventId}/comments${q}`);
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
    }, [eventId, user?.username]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    /* ===================== POST ===================== */
    const submitComment = async (e, parentId = null) => {
        e.preventDefault();
        if (!user) return;

        const text = newComment.trim();
        if (!text) return;

        await fetch(`/api/events/${eventId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: user.username,
                comment: text,
                parentId,
            }),
        });

        setNewComment("");
        fetchComments();
    };

    /* ===================== DELETE ===================== */
    const deleteComment = async (commentId) => {
        await fetch(
            `/api/events/${eventId}/comments/${commentId}?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            { method: "DELETE" }
        );
        fetchComments();
    };

    const requestDelete = (id) => {
        confirm(id, async () => {
            await deleteComment(id);
        });
    };

    /* ===================== REACTION ===================== */
    const toggleReaction = async (comment, type) => {
        if (!user || !comment?.id) return;

        await fetch(
            `/api/comments/${comment.id}/reactions?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type }),
            }
        );

        fetchComments();
    };

    /* ===================== RENDER ===================== */
    return (
        <div className={"comments-card-wrapper"}>
            <CommentSection
                comments={comments}
                user={user}
                newComment={newComment}
                setNewComment={setNewComment}
                onSubmit={submitComment}
                onDelete={requestDelete}
                toggleReaction={toggleReaction}   // ✅ PASS FUNCTION
                refreshComments={fetchComments}
            />

            <ConfirmDialog
                open={confirmState.open}
                title="Delete Comment"
                message="Are you sure you want to delete this comment?"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}
