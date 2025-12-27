import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext";
import PostCard from "./PostCard";
import ConfirmDialog from "../hooks/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import EditPostModal from "./EditPostModal";
import ReferencePicker from "./ReferencePicker";
import "../styles/Posts.css";

export default function PostFeed() {
    const { user } = useContext(AuthContext);

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newPost, setNewPost] = useState("");
    const [posting, setPosting] = useState(false);

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const [references, setReferences] = useState([]);
    const [editingPost, setEditingPost] = useState(null);

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

    /* ===================== CLEANUP PREVIEWS ===================== */

    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    /* ===================== CREATE POST ===================== */

    const createPost = async () => {
        if (!user) return;

        const text = newPost.trim();
        if (!text && images.length === 0 && references.length === 0) return;

        const form = new FormData();
        form.append("author", user.username);
        form.append("content", text);

        images.forEach(file => form.append("images", file));

        if (references.length > 0) {
            form.append("references", JSON.stringify(references));
        }

        try {
            setPosting(true);
            const res = await fetch("/api/posts", {
                method: "POST",
                body: form,
            });

            if (!res.ok) {
                alert("Failed to create post");
                return;
            }

            setNewPost("");
            setImages([]);
            setImagePreviews([]);
            setReferences([]);

            await fetchPosts();
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
                    ? { ...p, myLike: !liked, likes: liked ? p.likes - 1 : p.likes + 1 }
                    : p
            )
        );

        try {
            await fetch(
                `/api/posts/${post.id}/like?username=${encodeURIComponent(user.username)}`,
                { method: liked ? "DELETE" : "POST" }
            );
        } catch {
            setPosts(prev =>
                prev.map(p =>
                    p.id === post.id
                        ? { ...p, myLike: liked, likes: liked ? p.likes + 1 : p.likes - 1 }
                        : p
                )
            );
        }
    };

    /* ===================== DELETE POST ===================== */

    const requestDeletePost = (post) => {
        confirm(post, async (p) => {
            const snapshot = [...posts];
            setPosts(prev => prev.filter(x => x.id !== p.id));

            try {
                const res = await fetch(
                    `/api/posts/${p.id}?username=${encodeURIComponent(user.username)}&admin=${user.role === "ADMIN"}`,
                    { method: "DELETE" }
                );

                if (!res.ok) throw new Error();
            } catch {
                setPosts(snapshot);
                alert("Failed to delete post");
            }
        });
    };

    /* ===================== SAVE EDIT ===================== */

    const saveEdit = async ({
                                content,
                                removeImageIds = [],
                                newImages = [],
                                imageOrder = [],
                                references = [],
                            }) => {
        const form = new FormData();

        form.append("username", user.username);
        form.append("content", content);

        removeImageIds.forEach(id => form.append("removeImageIds", id));
        imageOrder.forEach(id => form.append("imageOrder", id));
        newImages.forEach(file => form.append("images", file));

        // 🔥 SAME REFERENCE FORMAT
        references.forEach(ref => {
            form.append("references", JSON.stringify(ref));
        });

        const res = await fetch(`/api/posts/${editingPost.id}`, {
            method: "PATCH",
            body: form,
        });

        if (!res.ok) {
            alert("Failed to update post");
            return;
        }

        const updated = await res.json();
        setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        setEditingPost(null);
    };

    /* ===================== PIN ===================== */

    const togglePin = async (post) => {
        const res = await fetch(
            `/api/posts/${post.id}/pin?username=${user.username}`,
            { method: "PATCH" }
        );

        if (!res.ok) {
            alert("Failed to toggle pin");
            return;
        }

        const updated = await res.json();
        setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    };

    /* ===================== RENDER ===================== */

    return (
        <div className="post-feed">
            {/* CREATE POST */}
            <div className="post-composer">
                <div className="post-avatar">
                    {user ? user.username[0].toUpperCase() : "?"}
                </div>

                <div className="composer-main">
                    <div className="composer-body">
                        <textarea
                            placeholder={user ? "What’s happening?" : "Log in to create a post"}
                            value={newPost}
                            onChange={e => setNewPost(e.target.value)}
                            disabled={!user || posting}
                            maxLength={500}
                        />

                        {imagePreviews.length > 0 && (
                            <div className={`image-grid grid-${imagePreviews.length}`}>
                                {imagePreviews.map((src, i) => (
                                    <div key={i} className="image-item">
                                        <img src={src} alt="" />
                                        <button
                                            className="remove-image"
                                            onClick={() => {
                                                setImages(prev => prev.filter((_, idx) => idx !== i));
                                                setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="composer-footer">
                        <input
                            id="post-image-input"
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: "none" }}
                            onChange={e => {
                                const files = Array.from(e.target.files || []);
                                if (!files.length) return;

                                setImages(prev => [...prev, ...files]);
                                setImagePreviews(prev => [
                                    ...prev,
                                    ...files.map(f => URL.createObjectURL(f)),
                                ]);
                            }}
                        />

                        <label htmlFor="post-image-input" className="file-btn">
                            📷 Add images
                        </label>

                        <ReferencePicker
                            references={references}
                            setReferences={setReferences}
                        />

                        <button
                            className="post-btn"
                            onClick={createPost}
                            disabled={
                                !user ||
                                posting ||
                                (!newPost.trim() && images.length === 0 && references.length === 0)
                            }
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>

            {/* POSTS */}
            {loading && <p>Loading posts…</p>}

            {posts.map(p => (
                <PostCard
                    key={p.id}
                    post={p}
                    user={user}
                    onLike={() => toggleLike(p)}
                    onDelete={requestDeletePost}
                    onEdit={setEditingPost}
                    onPin={() => togglePin(p)}
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
                message="Are you sure you want to delete this post?"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}
