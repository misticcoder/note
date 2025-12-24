// src/Posts/PostDetailPage.js

import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../AuthContext";
import PostCard from "../components/PostCard";
import CommentSection from "../CommentSection";
import "../styles/Threads.css"; // IMPORTANT: reuse thread styles

export default function PostDetailPage() {
    const { user } = useContext(AuthContext);

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    /* Extract postId from hash: #/post/123 */
    const postId = (() => {
        const m = (window.location.hash || "").match(/^#\/post\/(\d+)/i);
        return m ? Number(m[1]) : null;
    })();

    /* ===================== FETCH POST ===================== */

    const fetchPost = useCallback(async () => {
        const usernameParam = user?.username
            ? `?username=${encodeURIComponent(user.username)}`
            : "";

        const res = await fetch(`/api/posts${usernameParam}`);
        const data = await res.json();

        const found = Array.isArray(data)
            ? data.find(p => p.id === postId)
            : null;

        setPost(found || null);
    }, [postId, user?.username]);

    /* ===================== FETCH COMMENTS ===================== */

    const fetchComments = useCallback(async () => {
        const usernameParam = user?.username
            ? `?username=${encodeURIComponent(user.username)}`
            : "";

        const res = await fetch(
            `/api/posts/${postId}/comments${usernameParam}`
        );

        if (!res.ok) {
            console.error("Failed to load comments");
            setComments([]);
            return;
        }

        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
    }, [postId, user?.username]);

    /* ===================== INITIAL LOAD ===================== */

    useEffect(() => {
        if (!postId) return;

        (async () => {
            try {
                setLoading(true);
                await fetchPost();
                await fetchComments();
            } catch (e) {
                console.error("Failed to load post detail", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [postId, fetchPost, fetchComments]);

    /* ===================== POST COMMENT / REPLY ===================== */

    const postComment = async (e, parentId = null) => {
        e.preventDefault();

        if (!user) return;

        const text = newComment.trim();
        if (!text) return;

        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user.username,
                    comment: text,
                    parentId
                })
            });

            if (!res.ok) throw new Error();

            setNewComment("");
            await fetchComments();
        } catch {
            alert("Failed to post comment");
        }
    };



    /* ===================== DELETE COMMENT ===================== */

    const deleteComment = async (commentId) => {
        if (!user) return;

        if (!window.confirm("Delete this comment?")) return;

        try {
            const res = await fetch(
                `/api/posts/${postId}/comments/${commentId}?requesterEmail=${encodeURIComponent(
                    user.email
                )}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                throw new Error("Delete failed");
            }

            await fetchComments();
        } catch {
            alert("Failed to delete comment");
        }
    };

    /* ===================== LIKE HANDLER ===================== */

    const toggleLike = async () => {
        if (!user || !post) return;

        const url = `/api/posts/${post.id}/like?username=${encodeURIComponent(
            user.username
        )}`;

        try {
            await fetch(url, {
                method: post.myLike ? "DELETE" : "POST"
            });

            fetchPost();
        } catch (e) {
            console.error("Like failed", e);
        }
    };

    /* ===================== GUARDS ===================== */

    if (!postId) return <p>Invalid post link.</p>;
    if (loading) return <p>Loading…</p>;
    if (!post) return <p>Post not found.</p>;

    /* ===================== RENDER ===================== */

    return (
        <div className="post-detail">
            <PostCard
                post={post}
                user={user}
                onLike={toggleLike}
            />

            <CommentSection
                comments={comments}
                user={user}
                newComment={newComment}
                setNewComment={setNewComment}
                onSubmit={postComment}          // ← pass the function reference
                onDelete={deleteComment}
                refreshComments={fetchComments}
            />

        </div>
    );
}
