import { timeAgo } from "../components/timeAgo";
import ImageCarousel from "./ImageCarousal";
import "../styles/Posts.css";
import { useState, useRef, useEffect } from "react";
import ShareIcon from "../components/Icons/share.png";

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

    const getRefBadgeClass = (type) =>
        REF_BADGE_MAP[type] ?? REF_BADGE_MAP.DEFAULT;

    const [menuOpen, setMenuOpen] = useState(false);
    const [showReportPopup, setShowReportPopup] = useState(false);
    const menuRef = useRef(null);

    /* ---------- Close menu on outside click ---------- */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuOpen]);

    const handleShare = async (e) => {
        e.stopPropagation();

        const shareUrl = `${window.location.origin}/#/post/${post.id}`;

        // fire-and-forget share count
        fetch(`/api/posts/${post.id}/share`, { method: "POST" })
            .then(res => res.ok && onShare?.())
            .catch(() => {});

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Check out this post",
                    text: post.content?.slice(0, 100),
                    url: shareUrl,
                });
            } catch {
                // user canceled
            }
        } else {
            await navigator.clipboard.writeText(shareUrl);
            alert("Link copied to clipboard");
        }
    };



    return (
        <div className={`x-post ${post.pinned ? "pinned" : ""}`}>
            <div className="x-body">
                {/* ===================== HEADER ===================== */}
                <div className="x-header">
                    <div className="post-avatar">
                        {post.author?.[0]?.toUpperCase() || "?"}
                    </div>

                    <div className="x-user">
                        <span className="x-name">{post.author}</span>
                        <span className="x-handle">@{post.author}</span>
                        <span className="x-time">· {timeAgo(post.createdAt)}</span>
                    </div>

                    <div style={{ position: "relative" }}>
                        {post.pinned && (
                            <span
                                className="pin-badge"
                                data-tooltip="Pinned by admin"

                            >
                                📌
                            </span>
                        )}

                        <button
                            className="x-more"
                            data-tooltip="More"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen((p) => !p);
                            }}
                        >
                            ⋯
                        </button>

                        {menuOpen && (
                            <div
                                ref={menuRef}
                                className="post-menu"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    className="post-menu-item"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        setShowReportPopup(true);
                                    }}
                                >
                                    🚩 Report
                                </button>

                                {user &&
                                    (user.username === post.author ||
                                        user.role === "ADMIN") && (
                                        <>
                                            <button
                                                className="post-menu-item"
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    onEdit(post);
                                                }}
                                            >
                                                ✏️ Edit
                                            </button>

                                            <button
                                                className="post-menu-item danger"
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    onDelete(post);
                                                }}
                                            >
                                                🗑 Delete
                                            </button>
                                        </>
                                    )}

                                {user?.role === "ADMIN" && (
                                    <button
                                        className="post-menu-item"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onPin(post);
                                        }}
                                    >
                                        📌 {post.pinned ? "Unpin" : "Pin"}
                                    </button>
                                )}


                                <button
                                    className="post-menu-item cancel"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ===================== CONTENT ===================== */}
                <div
                    className="post-content"
                    onClick={() =>
                        (window.location.hash = `#/post/${post.id}`)
                    }
                >
                    {post.content && (
                        <div className="x-content">{post.content}</div>
                    )}

                    {post.references?.length > 0 && (
                        <span className="post-references">
                            {post.references.map((ref) => (
                                <a
                                    key={`${ref.type}-${ref.targetId}`}
                                    href={`/#/${ref.type.toLowerCase()}s/${ref.targetId}`}
                                    className={`badge post-reference ref-${ref.type.toLowerCase()} ${getRefBadgeClass(ref.type)}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    @{ref.displayText}
                                </a>
                            ))}
                        </span>
                    )}

                    {post.images?.length > 0 && (
                        <ImageCarousel
                            images={post.images.map((img) => img.url)}
                        />
                    )}
                </div>

                {/* ===================== ACTIONS ===================== */}
                <div className="x-actions">
                    <button
                        className="x-action reply"
                        data-tooltip = {"Reply"}
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.hash = `#/post/${post.id}`;
                        }}
                    >
                        💬 {post.replyCount || ""}
                    </button>

                    <button
                        className={`x-action like ${
                            post.myLike ? "active" : ""
                        }`}
                        data-tooltip = {"Like"}
                        onClick={(e) => {
                            e.stopPropagation();
                            onLike();
                        }}
                        disabled={!user}
                    >
                        ❤️ {post.likes}
                    </button>

                    <button className="x-action share"
                            data-tooltip = {"Share"}
                            onClick={handleShare}>
                        <img
                            src={ShareIcon}
                            className="action-icon reply-icon"
                         alt={"share"}/>

                        {post.shareCount || ""}
                    </button>

                </div>
            </div>

            {/* ===================== REPORT MODAL ===================== */}
            {showReportPopup && (
                <div
                    className="modal-backdrop"
                    onClick={() => setShowReportPopup(false)}
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Report Post</h3>
                        <p>This feature is coming soon.</p>

                        <div className="modal-actions">
                            <button
                                onClick={() => setShowReportPopup(false)}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
