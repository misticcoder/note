import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import "./styles/events.css";

export default function EventHeader({
                                        event,
                                        activeTab,
                                        rsvp,                 // "GOING" | "MAYBE" | null
                                        onRSVP,
                                        onCancelRSVP
                                    }) {
    const { user } = useContext(AuthContext);

    const TABS = ["overview", "posts", "attendees"];

    const start = event.startAt ? new Date(event.startAt) : null;
    const end = event.endAt ? new Date(event.endAt) : null;
    const now = new Date();

    let status = "UPCOMING";
    if (start && end && now >= start && now <= end) status = "LIVE";
    else if (end && now > end) status = "ENDED";

    return (
        <div className="event-header">
            {/* TOP ROW */}
            <div className="event-header-top">
                {/* LEFT */}
                <div className="event-header-left">
                    <img
                        src={event.bannerUrl || "./components/default.png"}
                        alt={event.title}
                        className="event-banner"
                        onError={(e) => {
                            e.currentTarget.onerror = null; // prevent infinite loop
                            e.currentTarget.src = "./components/default.png";
                        }}
                    />

                    <div className="event-meta">
                        <h1 className="event-title">
                            {event.title}
                            {status === "LIVE" && (
                                <span className="event-live-pill">LIVE</span>
                            )}
                        </h1>

                        {/* Time */}
                        {(start || end) && (
                            <div className="event-time">
                                {start && (
                                    <span>
                                        {"start "}- {start.toLocaleString()}
                                    </span>
                                )}
                                {end && (
                                    <span>
                                        {"end "}– {end.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Location */}
                        {event.location && (
                            <div className="event-location">
                                📍 {event.location}
                            </div>
                        )}

                        {/* Description */}
                        {event.description && (
                            <div className="event-description">
                                {event.description}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: RSVP */}
                {user && (
                    <div className="event-rsvp-pill">
                        <span className="event-user">
                            {user.username}
                        </span>

                        {rsvp === "GOING" ? (
                            <button
                                className="pill-btn pill-active"
                                onClick={onCancelRSVP}
                            >
                                Going ✓
                            </button>
                        ) : rsvp === "MAYBE" ? (
                            <button
                                className="pill-btn pill-active"
                                onClick={onCancelRSVP}
                            >
                                Maybe ✓
                            </button>
                        ) : (
                            <>
                                <button
                                    className="pill-btn pill-join"
                                    onClick={() => onRSVP("GOING")}
                                >
                                    Going
                                </button>
                                <button
                                    className="pill-btn pill-maybe"
                                    onClick={() => onRSVP("MAYBE")}
                                >
                                    Maybe
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* TABS */}
            <nav className="event-tabs">
                {TABS.map(tab => (
                    <a
                        key={tab}
                        href={`#/events/${event.id}/${tab}`}
                        className={activeTab === tab ? "active" : ""}
                        aria-current={activeTab === tab ? "page" : undefined}
                    >
                        {tab.toUpperCase()}
                    </a>
                ))}
            </nav>
        </div>
    );
}
