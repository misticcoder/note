import { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "../AuthContext";
import { apiFetch } from "../api";
import "../styles/activity.css";

export default function ActivityTab() {
    const { user } = useContext(AuthContext);

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* ─────────────────────────────
       Load notifications
       Backend marks them as read
    ───────────────────────────── */

    useEffect(() => {
        if (!user?.email) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        let alive = true;

        const load = async () => {
            try {
                const res = await apiFetch("/api/me/activity", {
                    headers: { "X-User-Email": user.email }
                });

                if (!res.ok) throw new Error();

                const data = await res.json();

                if (alive) {
                    setNotifications(Array.isArray(data) ? data : []);
                    setError("");

                    // 🔔 tell Header that activity is now read
                    window.dispatchEvent(new Event("activity:read"));
                }
            } catch {
                if (alive) setError("Failed to load activity");
            } finally {
                if (alive) setLoading(false);
            }
        };

        load();

        return () => {
            alive = false;
        };
    }, [user]);

    /* ─────────────────────────────
       Derived state
    ───────────────────────────── */

    const hasUnread = useMemo(
        () => notifications.some(n => !n.isRead),
        [notifications]
    );

    /* ─────────────────────────────
       Actions
    ───────────────────────────── */

    const markAsRead = async (id) => {
        try {
            await apiFetch(`/api/me/activity/${id}/read`, {
                method: "POST",
                headers: { "X-User-Email": user.email }
            });

            setNotifications(prev =>
                prev.map(n =>
                    n.id === id ? { ...n, isRead: true } : n
                )
            );
        } catch {
            // silent fail – UX > strictness
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiFetch("/api/me/activity/read-all", {
                method: "POST",
                headers: { "X-User-Email": user.email }
            });

            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );

            // sync header badge
            window.dispatchEvent(new Event("activity:read"));
        } catch {}
    };

    /* ─────────────────────────────
       Helpers
    ───────────────────────────── */

    const iconFor = (type) => {
        switch (type) {
            case "EVENT_CREATED": return "📅";
            case "EVENT_UPDATED": return "✏️";
            case "CLUB_UPDATE": return "🏟️";
            case "CLUB_JOIN": return "👥";
            case "COMMENT_REPLY": return "💬";

            default: return "🔔";
        }
    };

    const handleClick = (n) => {
        if (!n.isRead) markAsRead(n.id);

        if (n.relatedEventId) {
            window.location.hash =
                `#/events/${n.relatedEventId}?comment=${n.relatedCommentId}`;
        } else if (n.relatedClubId) {
            window.location.hash =
                `#/clubs/${n.relatedClubId}`;
        }
    };



    const ordered = [...notifications].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    /* ─────────────────────────────
       Render
    ───────────────────────────── */

    if (loading) {
        return <div className="muted">Loading activity…</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="activity-tab">

            <div className="activity-header">
                <h3>Activity</h3>

                {hasUnread && (
                    <button className="link" onClick={markAllAsRead}>
                        Mark all as read
                    </button>
                )}
            </div>

            {ordered.length === 0 && (
                <div className="muted">No activity yet</div>
            )}

            {ordered.map(n => (
                <div
                    key={n.id}
                    className={`activity-item ${n.isRead ? "" : "unread"}`}
                    onClick={() => handleClick(n)}
                >
                    <div className="activity-message">
                        {iconFor(n.type)} {n.message}
                    </div>

                    <div className="activity-time">
                        {n.createdAt
                            ? new Date(n.createdAt).toLocaleString()
                            : ""}
                    </div>
                </div>
            ))}
        </div>
    );
}
