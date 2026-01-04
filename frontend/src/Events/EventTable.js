import { useEffect, useState } from "react";
import "../styles/events.css";
import Dropdown from "../components/Dropdown";

export default function EventTable({
                                       events = [],
                                       loading = false,
                                       error = "",
                                       showClub = true,
                                       isAdmin = false,
                                       onEdit,
                                       onDelete
                                   }) {
    const [ratings, setRatings] = useState({});

    /* =====================
       EVENT STATUS
    ===================== */
    const getEventStatus = (ev) => {
        if (!ev?.startAt) return "UPCOMING";

        const now = new Date();
        const start = new Date(ev.startAt);
        const end = ev.endAt
            ? new Date(ev.endAt)
            : new Date(start.getTime() + 2 * 60 * 60 * 1000);

        if (now >= start && now <= end) return "LIVE";
        if (now > end) return "ENDED";
        return "UPCOMING";
    };

    /* =====================
       LOAD RATINGS
    ===================== */
    useEffect(() => {
        if (!events.length) return;

        let cancelled = false;

        (async () => {
            const entries = await Promise.all(
                events.map(async (e) => {
                    try {
                        const res = await fetch(`/api/events/${e.id}/rating`);
                        if (!res.ok) return [e.id, null];
                        return [e.id, await res.json()];
                    } catch {
                        return [e.id, null];
                    }
                })
            );

            if (!cancelled) {
                setRatings(Object.fromEntries(entries.filter(([, v]) => v)));
            }
        })();

        return () => (cancelled = true);
    }, [events]);

    if (loading) return <p className="muted">Loading…</p>;
    if (error) return <p className="error">{error}</p>;

    if (!events.length) {
        return (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>
                No events to display.
            </div>
        );
    }

    return (
        <div className="events-table">
            <div className="events-header">
                <div>#</div>
                <div>Event</div>
                {showClub && <div className={"club-col"}>Club</div>}
                <div>Status</div>
                <div>Avg. Rating</div>
                {isAdmin && <div className="actions-col">Actions</div>}
            </div>

            {events.map((ev, i) => {
                const status = getEventStatus(ev);

                return (
                    <div
                        key={ev.id}
                        className="events-row clickable"
                        onClick={() =>
                            (window.location.hash = `#/events/${ev.id}`)
                        }
                    >
                        <div className="rank">{i + 1}</div>

                        <div className="event-main">
                            <div className="event-title">{ev.title}</div>
                            <div className="event-meta">
                                {ev.startAt
                                    ? new Date(ev.startAt).toLocaleString()
                                    : "TBA"}
                                {ev.location && ` · ${ev.location}`}
                            </div>

                            {ev.tags?.map((t) => {
                                const label =
                                    typeof t === "string" ? t : t.name;
                                return (
                                    <span key={label} className="event-tag">
                                        {label}
                                    </span>
                                );
                            })}
                        </div>

                        {showClub && (
                            <div>
                                {ev.clubId ? (
                                    <span
                                        className="event-club-badge"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.hash = `#/clubs/${ev.clubId}`;
                                        }}
                                    >
                                        {ev.clubName}
                                    </span>
                                ) : (
                                    <span className="muted">Independent</span>
                                )}
                            </div>
                        )}


                        <div
                            className={`event-status ${status.toLowerCase()}`}
                        >
                            {status}
                        </div>

                        <div className="event-rating-inline">
                            {ratings[ev.id]?.count > 0 ? (
                                <>
                                    <span className="star">★</span>
                                    {ratings[ev.id].average.toFixed(1)}
                                    <span className="rating-count">
                                        ({ratings[ev.id].count})
                                    </span>
                                </>
                            ) : (
                                <span className="muted">No ratings</span>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="actions">
                                <Dropdown
                                    onEdit={() => onEdit(ev)}
                                    onDelete={() => onDelete(ev)}
                                />
                            </div>
                        )}

                    </div>
                );
            })}
        </div>
    );
}
