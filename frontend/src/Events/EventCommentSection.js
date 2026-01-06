// src/Events/EventCommentSection.js
import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../AuthContext";
import CommentSection from "../CommentSection";

export default function EventCommentSection({
                                                eventId,
                                                eventStatus,
                                                rsvp
                                            }) {
    const { user } = useContext(AuthContext);

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

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
        if (!user) return;

        await fetch(
            `/api/events/${eventId}/comments/${commentId}?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            { method: "DELETE" }
        );

        fetchComments();
    };

    /* ===================== RENDER ===================== */

    return (
        <CommentSection
            comments={comments}
            user={user}
            newComment={newComment}
            setNewComment={setNewComment}
            onSubmit={submitComment}
            onDelete={deleteComment}
            refreshComments={fetchComments}
        />
    );
}
