import "../styles/events.css";
import Dropdown from "../components/Dropdown";
import "../styles/badges.css";

export default function EventTable({
                                       events = [],
                                       loading = false,
                                       error = "",
                                       showClub = true,
                                       isPrivileged = false,
                                       onEdit,
                                       onDelete
                                   }) {

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
            <div className={`events-header ${isPrivileged ? "has-actions" : ""}`}>

                <div>#</div>
                <div>Event</div>
                {showClub && <div className="club-col">Club</div>}
                <div>Status</div>
                <div>Avg. Rating</div>
                {isPrivileged && <div >Visibility</div>}
                {isPrivileged && <div className="actions-col">Actions</div>}
            </div>

            {events.map((ev, i) => {
                const status = ev.status;

                return (
                    <div
                        key={ev.id}
                        className={`events-row clickable ${
                            isPrivileged ? "has-actions" : ""
                        }`}
                        onClick={() =>
                            (window.location.hash = `#/events/${ev.id}`)
                        }
                    >
                        <div className="rank">{i + 1}</div>

                        <div className="event-main">
                            <div
                                className="event-title"
                                style={{display: "flex", alignItems: "center", gap: 8}}
                            >
                                <span>{ev.title}</span>

                                {ev.category === "EXTERNAL" && ev.externalUrl && (
                                    <a
                                        href={ev.externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="external-link-btn"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Open link
                                    </a>
                                )}
                            </div>


                            <div className="event-meta">
                                {ev.startAt
                                    ? new Date(ev.startAt).toLocaleString()
                                    : "TBA"}
                                {ev.location && ` · ${ev.location}`}
                                {ev.author?.name && ` · by ${ev.author.name}`}

                            </div>

                            <div>
                                {ev.tags?.map((t) => (
                                    <span
                                        key={typeof t === "string" ? t : t.name}
                                        className="event-tag"
                                    >
                                    {typeof t === "string" ? t : t.name}
                                </span>
                                ))}
                            </div>
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

                        <div className={`event-status ${status.toLowerCase()}`}>
                            {status}
                        </div>

                        <div className="event-rating-inline">
                            {ev.ratingCount > 0 ? (
                                <>
                                    <span className="star">★</span>
                                    {ev.averageRating.toFixed(1)}
                                    <span className="rating-count">
                                        ({ev.ratingCount})
                                    </span>
                                </>
                            ) : (
                                <span className="muted">No ratings</span>
                            )}
                        </div>

                        {isPrivileged && (
                            <div>
        <span
            className={`visibility-badge ${
                ev.visibility === "PUBLIC" ? "public" : "restricted"
            }`}
        >
            {ev.visibility === "PUBLIC" ? "Public" : "Club Members"}
        </span>
                            </div>
                        )}


                        {isPrivileged && (
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
