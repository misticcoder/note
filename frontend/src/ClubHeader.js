import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export default function ClubHeader({
                                       club,
                                       activeTab,
                                       membership,        // { isMember, hasPending, isLeader }
                                       leaders = [],      // array of leader names
                                       onJoin,
                                       onLeave,
                                       onCancelRequest
                                   }) {
    const { user } = useContext(AuthContext);

    // Add settings tab for admins
    const isAdmin = user && String(user.role || "").toUpperCase() === "ADMIN";
    const TABS = isAdmin
        ? ["overview", "events", "news", "members", "settings"]
        : ["overview", "events", "news", "members"];

    return (
        <div className="club-header">
            {/* TOP ROW */}
            <div className="club-header-top">
                {/* LEFT */}
                <div className="club-header-left">
                    <img
                        src={club.logoUrl || "/default-club.png"}
                        alt={club.name}
                        className="club-logo"
                    />

                    <div className="club-meta">
                        <h1 className="club-title">
                            {club.name}
                            {club.shortName && (
                                <span className="club-short"> {club.shortName}</span>
                            )}
                        </h1>

                        {/* Leaders */}
                        {leaders.length > 0 && (
                            <div className="club-leaders">
                                ⭐ Leader{leaders.length > 1 ? "s" : ""}:{" "}
                                {leaders.join(", ")}
                            </div>
                        )}

                        {/* 🔔 Supervisor Badge */}
                        {club.supervisor && (
                            <div className="club-supervisor">
                                👤 Supervisor:{" "}
                                <span className="supervisor-badge">
                                    {club.supervisor.username || club.supervisor.email}
                                </span>
                            </div>
                        )}

                        {/* Description */}
                        {club.description && (
                            <div className="club-description">
                                {club.description}
                            </div>
                        )}

                        {/* Meta links */}
                        <div className="club-sub">
                            {club.website && (
                                <a
                                    href={club.website}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {club.website}
                                </a>
                            )}
                            {club.twitter && <span>@{club.twitter}</span>}
                            {club.country && <span>{club.country}</span>}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Join / Leave */}
                {user && (
                    <div className="club-member-pill">
                        <span className="club-member-user">
                            ⭐ {user.username}
                        </span>

                        {membership?.isMember ? (
                            membership?.isLeader ? (
                                <button
                                    className="pill-btn pill-disabled"
                                    disabled
                                >
                                    Leader
                                </button>
                            ) : (
                                <button
                                    className="pill-btn pill-leave"
                                    onClick={onLeave}
                                >
                                    Leave
                                </button>
                            )
                        ) : membership?.hasPending ? (
                            <button
                                className="pill-btn pill-pending"
                                onClick={onCancelRequest}
                            >
                                Pending
                            </button>
                        ) : (
                            <button
                                className="pill-btn pill-join"
                                onClick={onJoin}
                            >
                                Join
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* TABS */}
            <nav className="club-tabs">
                {TABS.map(tab => (
                    <a
                        key={tab}
                        href={`#/clubs/${club.id}/${tab}`}
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