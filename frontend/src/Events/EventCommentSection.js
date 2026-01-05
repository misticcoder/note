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

    const submitComment = async (e, parentId = null) => {
        e.preventDefault();
        if (!user) return;

        const text = newComment.trim();
        if (!text) return;

        const res = await fetch(
            `/api/events/${eventId}/comments?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    comment: text,
                    parentId
                })
            }
        );

        if (!res.ok) {
            alert("Failed to post comment");
            return;
        }

        setNewComment("");
        fetchComments();
    };

    const deleteComment = async (commentId) => {
        if (!user) return;

        await fetch(
            `/api/comments/${commentId}?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            { method: "DELETE" }
        );

        fetchComments();
    };

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
