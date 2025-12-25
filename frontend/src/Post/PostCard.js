import { timeAgo } from "../components/timeAgo";
import "../styles/Posts.css";
import ImageCarousel from "./ImageCarousal";

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
                {post.author?.[0]?.toUpperCase() || "?"}
            </div>

            {/* Body */}
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
                        data-tooltip="more"
                        onClick={(e) => e.stopPropagation()}
                    >
                        ⋯
                    </button>
                </div>

                {/* Content */}
                <div className="x-content">{post.content}</div>

                {post.images?.length > 0 && (
                    <ImageCarousel images={post.images} />
                )}


                {/* Actions */}
                <div className="x-actions">
                    <button
                        className="x-action reply"
                        data-tooltip="reply"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.hash = `#/post/${post.id}`;
                        }}
                    >
                        💬 {post.replyCount || ""}
                    </button>

                    <button
                        className={`x-action like ${post.myLike ? "active" : ""}`}
                        data-tooltip="like"
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
                        data-tooltip="share"
                        onClick={(e) => e.stopPropagation()}
                    >
                        ↗
                    </button>
                </div>
            </div>
        </div>
    );
}
