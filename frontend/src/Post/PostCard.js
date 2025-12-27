import { timeAgo } from "../components/timeAgo";
import "../styles/Posts.css";
import ImageCarousal from "./ImageCarousal";

export default function PostCard({ post, user, onLike, onDelete, onEdit, onPin }){
    return (
        <div
            className={`x-post ${post.pinned ? "pinned" : ""}`}
        >


            {/* Body */}
            <div className="x-body">
                {/* Header */}
                <div className="x-header">
                    {/* Avatar */}
                    <div className="post-avatar">
                        {post.author?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="x-user">
                        <span className="x-name">{post.author}</span>
                        <span className="x-handle">@{post.author}</span>
                        <span className="x-time">
                            · {timeAgo(post.createdAt)}
                        </span>
                    </div>

                    <div>
                        {post.pinned && <span className="pin-badge"
                        data-tooltip={"Pinned"}>📌</span>}
                        <button
                            className="x-more"
                            data-tooltip="More"
                            onClick={(e) => e.stopPropagation()}
                        >
                            ⋯
                        </button>
                    </div>

                </div>

                <div onClick={() => {
                    window.location.hash = `#/post/${post.id}`;
                }}>
                    {/* Content */}
                    <div className="x-content">{post.content}</div>

                    {/* Images */}
                    {post.images?.length > 0 && (
                        <ImageCarousal images={post.images} />
                    )}
                </div>


                {/* Actions */}
                <div className="x-actions">
                    <button
                        className="x-action reply"
                        data-tooltip="Reply"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.hash = `#/post/${post.id}`;
                        }}
                    >
                        💬 {post.replyCount || ""}
                    </button>

                    <button
                        className={`x-action like ${post.myLike ? "active" : ""}`}
                        data-tooltip={post.myLike ? "Unlike" : "Like"}
                        onClick={(e) => {
                            e.stopPropagation();
                            onLike();
                        }}
                        disabled={!user}
                    >
                        ❤️ {post.likes}
                    </button>

                    <button
                        className="x-action share"
                        data-tooltip="Share"
                        onClick={(e) => e.stopPropagation()}
                    >
                        ↗
                    </button>

                    {user &&
                        (user.username === post.author ||
                            user.role === "ADMIN") && (
                            <button
                                className="x-action danger"
                                data-tooltip="Delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(post);
                                }}
                            >
                                🗑
                            </button>
                        )}
                    {user &&
                        (user.username === post.author || user.role === "ADMIN") && (
                            <button
                                className="x-action"
                                data-tooltip="Edit"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(post);
                                }}
                            >
                                ✏️
                            </button>
                        )}
                    { user &&
                         user.role === "ADMIN" && (
                            <button
                                className={`x-action ${post.pinned ? "active" : ""}`}
                                data-tooltip={post.pinned ? "Unpin" : "Pin"}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPin(post);
                                }}
                            >
                                📌
                            </button>

                        )}

                </div>
            </div>
        </div>
    );
}
