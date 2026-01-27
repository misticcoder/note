import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext";
import PostCard from "./PostCard";
import ConfirmDialog from "../hooks/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import EditPostModal from "./EditPostModal";
import ReferencePicker from "./ReferencePicker";
import "../styles/Posts.css";

import { apiFetch } from "../api";

export default function PostFeed({eventId}) {
    const { user } = useContext(AuthContext);

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newPost, setNewPost] = useState("");
    const [posting, setPosting] = useState(false);

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const [references, setReferences] = useState([]);
    const [editingPost, setEditingPost] = useState(null);

    const isEventContext = Boolean(eventId);
    const canAnnounce = isEventContext && user?.role === "ADMIN";
    const [isAnnouncement, setIsAnnouncement] = useState(false);

    const [scheduleAt, setScheduleAt] = useState("");


    useEffect(() => {
        if (canAnnounce && isEventContext) {
            setIsAnnouncement(true);
        } else {
            setIsAnnouncement(false);
        }
    }, [canAnnounce, isEventContext]);


    const {
        confirmState,
        confirm,
        handleConfirm,
        handleCancel,
    } = useConfirm();

    const sortPosts = (posts) =>
        [...posts].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });


    /* ===================== FETCH POSTS ===================== */

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (user?.username) {
                params.append("username", user.username);
            }
            if (eventId) {
                params.append("eventId", eventId);
            }

            const res = await apiFetch(`/api/posts?${params.toString()}`);
            const data = await res.json();
            setPosts(sortPosts(Array.isArray(data) ? data : []));

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

        if (eventId) {
            form.append("eventId", eventId);
        }

        if (canAnnounce) {
            form.append("announcement", isAnnouncement);
        }

        if (scheduleAt) {
            form.append("publishAt", scheduleAt);
        }



        try {
            setPosting(true);
            const res = await apiFetch("/api/posts", {
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
            setIsAnnouncement(false);
            setScheduleAt("");


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
            await apiFetch(
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
                const res = await apiFetch(
                    `/api/posts/${p.id}?username=${encodeURIComponent(user.username)}`,
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
                                publishAt, // ✅ ADD THIS
                            }) => {
        const form = new FormData();

        form.append("username", user.username);
        form.append("content", content);

        removeImageIds.forEach(id => form.append("removeImageIds", id));
        imageOrder.forEach(id => form.append("imageOrder", id));
        newImages.forEach(file => form.append("images", file));
        form.append("references", JSON.stringify(references ?? []));

        // ✅ SEND SCHEDULE
        if (publishAt !== undefined) {
            // empty string => clear schedule
            form.append("publishAt", publishAt);
        }

        const res = await apiFetch(`/api/posts/${editingPost.id}`, {
            method: "PATCH",
            body: form,
        });

        if (res.status === 403) {
            alert("You are not allowed to edit this post.");
            return;
        }

        if (!res.ok) {
            alert("Failed to update post");
            return;
        }

        const updated = await res.json();

        setPosts(prev =>
            sortPosts(prev.map(p => (p.id === updated.id ? updated : p)))
        );

        setEditingPost(null);
    };



    /* ===================== PIN ===================== */

    const togglePin = async (post) => {
        const res = await apiFetch(
            `/api/posts/${post.id}/pin?username=${user.username}`,
            { method: "PATCH" }
        );

        if (!res.ok) {
            alert("Failed to toggle pin");
            return;
        }

        const updated = await res.json();
        setPosts(prev =>
            sortPosts(prev.map(p => (p.id === updated.id ? updated : p)))
        );

    };

    const incrementShareCount = (postId) => {
        setPosts(prev =>
            prev.map(p =>
                p.id === postId
                    ? { ...p, shareCount: (p.shareCount || 0) + 1 }
                    : p
            )
        );
    };


    /* ===================== RENDER ===================== */

    return (
        <div className="post-feed">
            {/* CREATE POST */}
            <div className="post-composer">
                <div className="composer-main">
                    <div className={"composer-header"}>
                        <div className="post-avatar">
                            {user ? user.username[0].toUpperCase() : "?"}
                        </div>
                        <div className={"x-user"}>
                            <span className="x-name">{user ? user.username : "?"}</span>
                            <span className="x-handle">@{user ? user.username : "?"}</span>
                        </div>
                    </div>
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
                                        <img src={src} alt=""/>
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
                            style={{display: "none"}}
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

                        <label htmlFor="post-image-input" className="file-btn"> 📷 Add images
                        </label>

                        <div>
                            <ReferencePicker
                                references={references}
                                setReferences={setReferences}
                            />
                        </div>

                        {canAnnounce && (
                            <label className="announcement-toggle">
                                <input
                                    type="checkbox"
                                    checked={isAnnouncement}
                                    onChange={e => setIsAnnouncement(e.target.checked)}
                                    disabled={posting}
                                />
                                Announcement
                            </label>
                        )}

                        {canAnnounce && isAnnouncement && (
                            <div className="schedule-row">
                                <label>
                                    Publish at:
                                    <input
                                        type="datetime-local"
                                        value={scheduleAt}
                                        onChange={e => setScheduleAt(e.target.value)}
                                    />
                                </label>
                            </div>
                        )}


                        <div className={"composer-actions"}>
                            <button
                                className="post-btn"
                                onClick={createPost}
                                disabled={
                                    !user ||
                                    posting ||
                                    (!newPost.trim() && images.length === 0 && references.length === 0)
                                }
                            > Post
                            </button>
                        </div>
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
                    onShare={() => incrementShareCount(p.id)}
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
