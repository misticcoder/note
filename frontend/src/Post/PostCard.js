import { timeAgo } from "../components/timeAgo";
import ImageCarousel from "./ImageCarousal";
import "../styles/Posts.css";

export default function PostCard({
                                     post,
                                     user,
                                     onLike,
                                     onDelete,
                                     onEdit,
                                     onPin,
                                 }) {
    const REF_BADGE_MAP = {
        CLUB: "badge--yellow",
        EVENT: "badge--purple",
        THREAD: "badge--blue",
        USER: "badge--yellow",
        POST: "badge--indigo",
        DEFAULT: "badge--gray",
    };

    function getRefBadgeClass(type) {
        return REF_BADGE_MAP[type] ?? REF_BADGE_MAP.DEFAULT;
    }


    return (
        <div
            className={`x-post ${post.pinned ? "pinned" : ""}`}
        >
            <div className="x-body">
                {/* ===================== HEADER ===================== */}
                <div className="x-header">
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


                <div className={"post-content"}
                     onClick={() => {
                         window.location.hash = `#/post/${post.id}`;
                     }}>
                    {/* ===================== CONTENT ===================== */}
                    {post.content && (
                        <div className="x-content">{post.content}</div>
                    )}

                    {/* ===================== REFERENCES ===================== */}
                    {post.references?.length > 0 && (
                        <span className="post-references">
                            {post.references.map(ref => (
                                <a
                                    key={`${ref.type}-${ref.targetId}`}
                                    href={`/#/${ref.type.toLowerCase()}s/${ref.targetId}`}
                                    className={`
                                        badge
                                        post-reference
                                        ref-${ref.type.toLowerCase()}
                                        ${getRefBadgeClass(ref.type)}
                                    `}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    @{ref.displayText}
                                </a>
                            ))}
                        </span>
                    )}

                    {/* ===================== IMAGES ===================== */}
                    {post.images?.length > 0 && (
                        <ImageCarousel images={post.images.map(img => img.url)} />
                    )}
                </div>


                {/* ===================== ACTIONS ===================== */}
                <div className="x-actions">
                    <button
                        className="x-action reply"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.hash = `#/post/${post.id}`;
                        }}
                    >
                        💬 {post.replyCount || ""}
                    </button>

                    <button
                        className={`x-action like ${post.myLike ? "active" : ""}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onLike();
                        }}
                        disabled={!user}
                    >
                        ❤️ {post.likes}
                    </button>

                    {(user &&
                        (user.username === post.author ||
                            user.role === "ADMIN")) && (
                        <>
                            <button
                                className="x-action"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(post);
                                }}
                            >
                                ✏️
                            </button>

                            <button
                                className="x-action danger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(post);
                                }}
                            >
                                🗑
                            </button>

                            <button
                                className="x-action"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPin(post);
                                }}
                            >
                                📌
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ===================== REFERENCE CHIP ===================== */

function ReferenceChip({ refData }) {
    const { type, targetId, displayText } = refData;

    const ICONS = {
        CLUB: "🏟️",
        EVENT: "📅",
        THREAD: "💬",
    };

    const href = `#/${type.toLowerCase()}s/${targetId}`;
    const icon = ICONS[type] ?? "🔗";

    return (
        <a
            href={href}
            className={`
                badge
                reference-chip
                ref-${type.toLowerCase()}
                ${getRefBadgeClass(type)}
            `}
            onClick={(e) => e.stopPropagation()}
        >
            {icon} {displayText}
        </a>
    );
}
