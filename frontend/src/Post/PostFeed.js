// src/Posts/PostFeed.jsx

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext";
import PostCard from "./PostCard";
import ConfirmDialog from "../hooks/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import "../styles/Posts.css";
import EditPostModal from "./EditPostModal";

export default function PostFeed() {
    const { user } = useContext(AuthContext);

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newPost, setNewPost] = useState("");
    const [posting, setPosting] = useState(false);

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const [editingPost, setEditingPost] = useState(null);


    /* ===================== CONFIRM HOOK ===================== */

    const {
        confirmState,
        confirm,
        handleConfirm,
        handleCancel,
    } = useConfirm();

    /* ===================== FETCH POSTS ===================== */

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const usernameParam = user?.username
                ? `?username=${encodeURIComponent(user.username)}`
                : "";

            const res = await fetch(`/api/posts${usernameParam}`);
            const data = await res.json();

            setPosts(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Failed to load posts", e);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchPosts();
    }, [user?.username]);

    /* Force re-render every minute for timeAgo */
    useEffect(() => {
        const interval = setInterval(() => {
            setPosts(p => [...p]);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    /* Cleanup image preview URLs */
    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    /* ===================== CREATE POST ===================== */

    const createPost = async () => {
        if (!user) return;

        const text = newPost.trim();
        if (!text && images.length === 0) return;

        const form = new FormData();
        form.append("author", user.username);
        form.append("content", text);
        images.forEach(file => form.append("images", file));

        try {
            setPosting(true);

            const res = await fetch("/api/posts", {
                method: "POST",
                body: form,
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                alert(body.message || "Failed to create post");
                return;
            }

            setNewPost("");
            setImages([]);
            setImagePreviews([]);

            await fetchPosts();

        } catch (e) {
            console.error("Create post failed", e);
        } finally {
            setPosting(false);
        }
    };

    /* ===================== LIKE ===================== */

    const toggleLike = async (post) => {
        if (!user) return;

        const liked = post.myLike;

        setPosts(prev =>
            prev.map(p =>
                p.id === post.id
                    ? {
                        ...p,
                        myLike: !liked,
                        likes: liked ? p.likes - 1 : p.likes + 1,
                    }
                    : p
            )
        );

        try {
            await fetch(
                `/api/posts/${post.id}/like?username=${encodeURIComponent(
                    user.username
                )}`,
                { method: liked ? "DELETE" : "POST" }
            );
        } catch {
            // rollback
            setPosts(prev =>
                prev.map(p =>
                    p.id === post.id
                        ? {
                            ...p,
                            myLike: liked,
                            likes: liked ? p.likes + 1 : p.likes - 1,
                        }
                        : p
                )
            );
        }
    };

    /* ===================== DELETE POST ===================== */

    const requestDeletePost = (post) => {
        confirm(post, async (p) => {
            const snapshot = [...posts];

            // optimistic remove
            setPosts(prev => prev.filter(x => x.id !== p.id));

            try {
                const res = await fetch(
                    `/api/posts/${p.id}?username=${encodeURIComponent(
                        user.username
                    )}&admin=${user.role === "ADMIN"}`,
                    { method: "DELETE" }
                );

                if (!res.ok) throw new Error();
            } catch {
                // 🔴 rollback on failure
                setPosts(snapshot);
                alert("Failed to delete post");
            }
        });
    };

    /* SAVE HANDLER */

    const saveEdit = async ({
                                content,
                                removeImageIds = [],
                                newImages = [],
                                imageOrder = []
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
            `/api/posts/${editingPost.id}`,
            { method: "PATCH", body: form }
        );

        if (!res.ok) {
            alert("Failed to update post");
            return;
        }

        const updated = await res.json();

        setPosts(prev =>
            prev.map(p => (p.id === updated.id ? updated : p))
        );

        setEditingPost(null);
    };


    /* ===================== RENDER ===================== */

    return (
        <div className="post-feed">
            {/* ===================== CREATE POST ===================== */}

            <div className="post-composer">
                <div className="composer-avatar">
                    {user ? user.username[0].toUpperCase() : "?"}
                </div>

                <div className="composer-main">
                    {/* ---------- BODY ---------- */}
                    <div className="composer-body">
                <textarea
                    placeholder={
                        user
                            ? "What’s happening?"
                            : "Log in to create a post"
                    }
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    disabled={!user || posting}
                    maxLength={500}
                />

                        {/* Image previews belong in BODY */}
                        {imagePreviews.length > 0 && (
                            <div className={`image-grid grid-${imagePreviews.length}`}>
                                {imagePreviews.map((src, i) => (
                                    <div key={i} className="image-item">
                                        <img src={src} alt={`preview-${i}`}/>
                                        <button
                                            className="remove-image"
                                            onClick={() => {
                                                setImages(prev =>
                                                    prev.filter((_, idx) => idx !== i)
                                                );
                                                setImagePreviews(prev =>
                                                    prev.filter((_, idx) => idx !== i)
                                                );
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ---------- FOOTER ---------- */}
                    <div className="composer-footer">
                        {/* Hidden file input */}
                        <input
                            id="post-image-input"
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={!user || posting}
                            style={{display: "none"}}
                            onChange={e => {
                                const files = Array.from(e.target.files || []);
                                if (!files.length) return;

                                if (images.length + files.length > 4) {
                                    alert("Maximum 4 images per post");
                                    return;
                                }

                                setImages(prev => [...prev, ...files]);
                                setImagePreviews(prev => [
                                    ...prev,
                                    ...files.map(f => URL.createObjectURL(f)),
                                ]);
                            }}
                        />

                        <label
                            htmlFor="post-image-input"
                            className={`file-btn ${(!user || posting) ? "disabled" : ""}`}
                        >
                            📷 Add images
                        </label>

                        <button
                            className="post-btn"
                            onClick={createPost}
                            disabled={
                                !user ||
                                posting ||
                                (!newPost.trim() && images.length === 0)
                            }
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>

            {/* ===================== POSTS ===================== */}

            {loading && <p>Loading posts…</p>}

            {posts.map(p => (
                <PostCard
                    key={p.id}
                    post={p}
                    user={user}
                    onLike={() => toggleLike(p)}
                    onDelete={requestDeletePost}
                    onEdit={setEditingPost}
                />

            ))}

            {editingPost && (
                <EditPostModal
                    post={editingPost}
                    onClose={() => setEditingPost(null)}
                    onSave={saveEdit}
                />
            )}


            <ConfirmDialog
                open={confirmState.open}
                title="Delete Post"
                message="Are you sure you want to delete this post? This action cannot be undone."
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>

    );
}
