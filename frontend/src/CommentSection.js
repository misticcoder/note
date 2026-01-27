// src/CommentSection.js
import { useState } from "react";
import CommentItem from "./Comments/CommentItem";
import "./styles/Threads.css";
import "./styles/comments.css"
import {apiFetch} from "./api";

/* ===============================
   Build tree from flat list
================================ */
function buildCommentTree(comments) {
    const map = new Map();
    const roots = [];

    comments.forEach(c => {
        map.set(c.id, { ...c, replies: [] });
    });

    map.forEach(c => {
        if (c.parentId) {
            const parent = map.get(c.parentId);
            if (parent) parent.replies.push(c);
        } else {
            roots.push(c);
        }
    });

    return roots;
}


/* ===============================
   Comment Section
================================ */
export default function CommentSection({
                                           comments,
                                           user,
                                           newComment,
                                           setNewComment,
                                           onSubmit,
                                           onDelete,
                                           refreshComments
                                       }) {

    const [error, setError] = useState(null);
    const role = String(user?.role || "").toUpperCase();
    const isAdmin = role === "ADMIN";

    const [replyTo, setReplyTo] = useState(null);

    const tree = buildCommentTree(Array.isArray(comments) ? comments : []);

    async function toggleReaction(comment, type) {
        if (!user) return;

        await apiFetch(
            `/api/comments/${comment.id}/reactions?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type }),
            }
        );

        refreshComments();
    }


    /* -------- Submit handler -------- */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!user) return;

        const text = newComment.trim();

        if (!text) return;

        if (text.length > 400){
            setError("comment is too long (max 400 characters)")
            return;
        }

        onSubmit(e, replyTo);
        setReplyTo(null);
    };

    return (

        <div className="comments-card">
            <h3 style={{color:"#000"}}>Comments</h3>

            {tree.length === 0 && <p>No comments yet.</p>}

            <ul className="comment-list">
                {tree.map(c => (
                    <CommentItem
                        key={c.id}
                        comment={c}
                        user={user}
                        isAdmin={isAdmin}
                        onDelete={onDelete}
                        toggleReaction={toggleReaction}
                        onReply={setReplyTo}
                    />
                ))}
            </ul>

            {user && replyTo && (
                <div className="replying-indicator">
                    Replying to comment #{replyTo}
                    <button onClick={() => setReplyTo(null)}>Cancel</button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="comment-form">
                <textarea
                    value={newComment}
                    className={"textarea"}
                    onChange={e => setNewComment(e.target.value)}
                    disabled={!user}
                    placeholder={
                        user
                            ? replyTo
                                ? "Write a reply…"
                                : "Write a comment…"
                            : "Log in to comment"
                    }
                />
                <button className={"post-btn"} disabled={!user || !newComment.trim()}>
                    {replyTo ? "Post Reply" : "Post Comment"}
                </button>
            </form>

            {error && (
                <div className="toast-error">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

        </div>
    );
}
