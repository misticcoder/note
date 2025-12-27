// src/Posts/PostDetailPage.js

import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../AuthContext";
import PostCard from "./PostCard";
import CommentSection from "../CommentSection";
import ConfirmDialog from "../hooks/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import EditPostModal from "./EditPostModal";
import "../styles/Posts.css";

export default function PostDetailPage() {
    const { user } = useContext(AuthContext);

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [postId, setPostId] = useState(null);
    const [editingPost, setEditingPost] = useState(null);

    /* ===================== CONFIRM HOOK ===================== */

    const {
        confirmState,
        confirm,
        handleConfirm,
        handleCancel,
    } = useConfirm();

    /* ===================== EXTRACT POST ID ===================== */

    useEffect(() => {
        const extractId = () => {
            const m = (window.location.hash || "").match(/^#\/post\/(\d+)/i);
            setPostId(m ? Number(m[1]) : null);
        };

        extractId();
        window.addEventListener("hashchange", extractId);
        return () => window.removeEventListener("hashchange", extractId);
    }, []);

    /* ===================== FETCH POST ===================== */

    const fetchPost = useCallback(async () => {
        if (!postId) return;

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
        if (!postId) return;

        const usernameParam = user?.username
            ? `?username=${encodeURIComponent(user.username)}`
            : "";

        const res = await fetch(
            `/api/posts/${postId}/comments${usernameParam}`
        );

        if (!res.ok) {
            setComments([]);
            return;
        }

        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
    }, [postId, user?.username]);

    /* ===================== INITIAL LOAD ===================== */

    useEffect(() => {
        if (!postId) return;
        let alive = true;

        (async () => {
            setLoading(true);
            await Promise.all([fetchPost(), fetchComments()]);
            if (alive) setLoading(false);
        })();

        return () => {
            alive = false;
        };
    }, [postId, fetchPost, fetchComments]);

    /* ===================== POST COMMENT ===================== */

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
                    parentId,
                }),
            });

            if (!res.ok) throw new Error();

            setNewComment("");
            fetchComments();
        } catch {
            alert("Failed to post comment");
        }
    };

    /* ===================== DELETE POST ===================== */

    const requestDeletePost = () => {
        confirm(null, async () => {
            await fetch(
                `/api/posts/${post.id}?username=${encodeURIComponent(
                    user.username
                )}&admin=${user.role === "ADMIN"}`,
                { method: "DELETE" }
            );

            window.history.back();
        });
    };

    /* ===================== DELETE COMMENT ===================== */

    const requestDeleteComment = (commentId) => {
        confirm(commentId, async (id) => {
            await fetch(
                `/api/posts/${postId}/comments/${id}?requesterEmail=${encodeURIComponent(
                    user.email
                )}`,
                { method: "DELETE" }
            );

            fetchComments();
        });
    };

    /* ===================== LIKE ===================== */

    const toggleLike = async () => {
        if (!user || !post) return;

        const liked = post.myLike;

        // optimistic update
        setPost(prev => ({
            ...prev,
            myLike: !liked,
            likes: liked ? prev.likes - 1 : prev.likes + 1,
        }));

        try {
            await fetch(
                `/api/posts/${post.id}/like?username=${encodeURIComponent(
                    user.username
                )}`,
                { method: liked ? "DELETE" : "POST" }
            );
        } catch {
            // rollback
            setPost(prev => ({
                ...prev,
                myLike: liked,
                likes: liked ? prev.likes + 1 : prev.likes - 1,
            }));
        }
    };

    /* ===================== SAVE EDIT ===================== */

    const saveEdit = async ({
                                content,
                                removeImageIds = [],
                                newImages = [],
                                imageOrder = [],
                            }) => {
        const form = new FormData();

        form.append("username", user.username);
        form.append("content", content);

        removeImageIds.forEach(id =>
            form.append("removeImageIds", id)
        );

        imageOrder.forEach(id =>
            form.append("imageOrder", id)
        );

        newImages.forEach(file =>
            form.append("images", file)
        );

        const res = await fetch(
            `/api/posts/${post.id}`,
            { method: "PATCH", body: form }
        );

        if (!res.ok) {
            alert("Failed to update post");
            return;
        }

        const updated = await res.json();
        setPost(updated);
        setEditingPost(null);
    };

    const togglePin = async () => {
        if (!user || !post) return;

        const res = await fetch(
            `/api/posts/${post.id}/pin?username=${user.username}`,
            { method: "PATCH" }
        );

        if (!res.ok) {
            alert("Failed to toggle pin");
            return;
        }

        const updated = await res.json();
        setPost(updated);
    };


    /* ===================== GUARDS ===================== */

    if (!postId) return <p>Invalid post link.</p>;
    if (loading) return <p>Loading…</p>;
    if (!post) return <p>Post not found.</p>;

    /* ===================== RENDER ===================== */

    return (
        <div className="post-page">
            <div className="post-page-inner">
                <div className="post-nav">
                    <button
                        className="back-btn"
                        onClick={() => window.history.back()}
                    >
                        ← Back
                    </button>
                </div>

                <div className="post-card-wrapper">
                    <PostCard
                        key={post.id}
                        post={post}
                        user={user}
                        onLike={toggleLike}
                        onDelete={requestDeletePost}
                        onEdit={setEditingPost}
                        onPin={togglePin}
                    />


                </div>

                <div className="comments-card-wrapper">
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

            {/* ===================== EDIT MODAL ===================== */}

            {editingPost && (
                <EditPostModal
                    post={editingPost}
                    onClose={() => setEditingPost(null)}
                    onSave={saveEdit}
                />
            )}

            {/* ===================== CONFIRM DIALOG ===================== */}

            <ConfirmDialog
                open={confirmState.open}
                title="Confirm Deletion"
                message="Are you sure you want to delete this? This action cannot be undone."
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}
