import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext";
import PostCard from "./PostCard";
import "../styles/Posts.css";

export default function PostFeed() {
    const { user } = useContext(AuthContext);

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [posting, setPosting] = useState(false);

    const fetchPosts = async () => {
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
        const interval = setInterval(() => {
            setPosts(p => [...p]); // force re-render for timeAgo
        }, 60000); // every minute

        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        fetchPosts();
    }, [user]);

    const createPost = async () => {
        if (!user) return;

        const text = newPost.trim();
        if (!text) return;

        try {
            setPosting(true);

            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    author: user.username,
                    content: text
                })
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                alert(body.message || "Failed to create post");
                return;
            }

            setNewPost("");
            await fetchPosts();
        } catch (e) {
            console.error("Create post failed", e);
        } finally {
            setPosting(false);
        }
    };

    const toggleLike = async (post) => {
        if (!user) return;

        const url = `/api/posts/${post.id}/like?username=${encodeURIComponent(
            user.username
        )}`;

        try {
            await fetch(url, {
                method: post.myLike ? "DELETE" : "POST"
            });
            fetchPosts();
        } catch (e) {
            console.error("Like failed", e);
        }
    };

    return (
        <div className="post-feed">
            {/* Create Post */}
            <div className="post-composer">
                <div className="post-avatar">
                    {user ? user.username[0].toUpperCase() : "?"}
                </div>

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

                    <div className="composer-actions">
                        <button
                            onClick={createPost}
                            disabled={!user || posting || !newPost.trim()}
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>

            {loading && <p>Loading posts…</p>}

            {posts.map(p => (
                <PostCard
                    key={p.id}
                    post={p}
                    user={user}
                    onLike={() => toggleLike(p)}
                />
            ))}
        </div>
    );
}
