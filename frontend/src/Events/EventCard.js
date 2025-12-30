import { useState } from "react";

export default function EventCard({
                                      event,
                                      isAdmin,
                                      onEdit,
                                      onDelete,
                                      onOpen,
                                      styles,
                                      boxHover
                                  }) {
    const [hovered, setHovered] = useState(false);

    const now = new Date();
    let label = "";

    if (event._status === "LIVE") {
        label = "LIVE";
    } else if (event._status === "ENDED") {
        label = "Ended";
    } else if (event.startAt) {
        const diff = new Date(event.startAt) - now;
        const mins = Math.max(0, Math.floor(diff / 60000));
        const d = Math.floor(mins / 1440);
        const h = Math.floor((mins % 1440) / 60);
        const m = mins % 60;

        label = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    return (
        <div
            style={{
                ...styles.Events,
                ...(hovered ? boxHover : {})
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onOpen(event.id)}
        >
            <div style={styles.eventTitle}>{event.title}</div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                    style={{
                        ...styles.eventTime,
                        ...(event._status === "LIVE"
                            ? styles.livePill
                            : event._status === "ENDED"
                                ? styles.endedText
                                : {})
                    }}
                >
                    {label}
                </div>

                {isAdmin && event._status !== "ENDED" && (
                    <>
                        <button
                            style={styles.smallBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(event);
                            }}
                        >
                            Edit
                        </button>

                        <button
                            style={{ ...styles.smallBtn, background: "#c0392b" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(event.id);
                            }}
                        >
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
