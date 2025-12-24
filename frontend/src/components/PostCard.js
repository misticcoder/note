import { timeAgo } from "./timeAgo";

export default function PostCard({ post, user, onLike }) {
    return (
        <div
            className="x-post"
            onClick={() => {
                window.location.hash = `#/post/${post.id}`;
            }}
        >
            {/* Avatar */}
            <div className="x-avatar">
                {post.author[0].toUpperCase()}
            </div>

            {/* Main content */}
            <div className="x-body">
                {/* Header */}
                <div className="x-header">
                    <div className="x-user">
                        <span className="x-name">{post.author}</span>
                        <span className="x-handle">@{post.author}</span>
                        <span className="x-time">
                            · {timeAgo(post.createdAt)}
                        </span>
                    </div>

                    <button
                        className="x-more"
                        onClick={(e) => e.stopPropagation()}
                    >
                        ⋯
                    </button>
                </div>

                {/* Text */}
                <div className="x-content">
                    {post.content}
                </div>

                {/* Image (future-proof) */}
                {post.imageUrl && (
                    <img
                        src={post.imageUrl}
                        alt=""
                        className="x-image"
                    />
                )}

                {/* Actions */}
                <div className="x-actions">
                    <button
                        className="x-action"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.hash = `#/post/${post.id}`;
                        }}
                    >
                        💬 {post.replyCount || ""}
                    </button>

                    <button
                        className={`x-action ${post.myLike ? "liked" : ""}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onLike();
                        }}
                        disabled={!user}
                    >
                        ❤️ {post.likes}
                    </button>

                    <button
                        className="x-action"
                        onClick={(e) => e.stopPropagation()}
                    >
                        ↗
                    </button>
                </div>
            </div>
        </div>
    );
}
