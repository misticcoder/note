import { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "./AuthContext";
import EventHeader from "./EventHeader";
import PostFeed from "./Post/PostFeed";
import EditEventModal from "./Events/EditEventModal";
import "./styles/events.css";

export default function EventPage() {
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* =====================
       ADMIN STATE
    ===================== */
    const [editingEvent, setEditingEvent] = useState(null);
    const isAdmin =
        String(user?.role || "").toUpperCase() === "ADMIN";

    /* =====================
       RSVP STATE
    ===================== */
    const [rsvp, setRsvp] = useState(null);
    const [counts, setCounts] = useState({ going: 0, maybe: 0 });

    /* =====================
       ATTENDEES STATE
    ===================== */
    const [goingAttendees, setGoingAttendees] = useState([]);
    const [maybeAttendees, setMaybeAttendees] = useState([]);
    const [attendeesLoading, setAttendeesLoading] = useState(false);
    const [attendeeQuery, setAttendeeQuery] = useState("");

    /* =====================
       ROUTING
    ===================== */
    const { eventId, activeTab } = useMemo(() => {
        const m = (window.location.hash || "").match(
            /^#\/events\/(\d+)(?:\/(\w+))?/
        );
        return {
            eventId: m ? Number(m[1]) : null,
            activeTab: m?.[2] || "overview",
        };
    }, [window.location.hash]);

    /* =====================
       FETCH EVENT
    ===================== */
    useEffect(() => {
        if (!eventId) return;

        setLoading(true);
        fetch(`/api/events/${eventId}`)
            .then((r) => {
                if (!r.ok) throw new Error("Event not found");
                return r.json();
            })
            .then(setEvent)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [eventId]);

    /* =====================
       RSVP + COUNTS
    ===================== */
    useEffect(() => {
        if (!eventId || !user) return;

        fetch(
            `/api/events/${eventId}/rsvp?requesterEmail=${encodeURIComponent(
                user.email
            )}`
        )
            .then((r) => r.json())
            .then((d) => setRsvp(d.status || null))
            .catch(() => {});

        fetch(`/api/events/${eventId}/attendance`)
            .then((r) => r.json())
            .then(setCounts)
            .catch(() => {});
    }, [eventId, user]);

    /* =====================
       RSVP ACTIONS
    ===================== */
    const sendRSVP = async (status) => {
        if (!user) return;

        await fetch(
            `/api/events/${eventId}/rsvp?requesterEmail=${encodeURIComponent(
                user.email
            )}&status=${status}`,
            { method: "POST" }
        );

        setRsvp(status);
        setCounts(
            await fetch(`/api/events/${eventId}/attendance`).then((r) =>
                r.json()
            )
        );
    };

    const cancelRSVP = async () => {
        if (!user) return;

        await fetch(
            `/api/events/${eventId}/rsvp?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            { method: "DELETE" }
        );

        setRsvp(null);
        setCounts(
            await fetch(`/api/events/${eventId}/attendance`).then((r) =>
                r.json()
            )
        );
    };

    /* =====================
       ATTENDEES
    ===================== */
    useEffect(() => {
        if (activeTab !== "attendees" || !eventId) return;

        setAttendeesLoading(true);

        Promise.all([
            fetch(`/api/events/${eventId}/attendees?status=GOING`).then((r) =>
                r.json()
            ),
            fetch(`/api/events/${eventId}/attendees?status=MAYBE`).then((r) =>
                r.json()
            ),
        ])
            .then(([going, maybe]) => {
                setGoingAttendees(Array.isArray(going) ? going : []);
                setMaybeAttendees(Array.isArray(maybe) ? maybe : []);
            })
            .finally(() => setAttendeesLoading(false));
    }, [activeTab, eventId]);

    const filteredGoing = useMemo(
        () =>
            goingAttendees.filter((a) =>
                a.username
                    .toLowerCase()
                    .includes(attendeeQuery.toLowerCase())
            ),
        [goingAttendees, attendeeQuery]
    );

    const filteredMaybe = useMemo(
        () =>
            maybeAttendees.filter((a) =>
                a.username
                    .toLowerCase()
                    .includes(attendeeQuery.toLowerCase())
            ),
        [maybeAttendees, attendeeQuery]
    );

    /* =====================
       ADMIN: EDIT / DELETE
    ===================== */
    const saveEvent = async (updates) => {
        if (!user || !event) return;

        const res = await fetch(
            `/api/events/${event.id}?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            }
        );

        const body = await res.json();
        if (!res.ok) {
            alert(body.message || "Failed to update event");
            return;
        }

        setEvent(body);
        setEditingEvent(null);
    };

    const deleteEvent = async () => {
        if (!user || !event) return;

        if (!window.confirm("Delete this event? This cannot be undone.")) {
            return;
        }

        const res = await fetch(
            `/api/events/${event.id}?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            { method: "DELETE" }
        );

        if (!res.ok) {
            alert("Failed to delete event");
            return;
        }

        window.location.hash = "#/events";
    };

    /* =====================
       STATES
    ===================== */
    if (loading) return <div className="event-page">Loading…</div>;
    if (error || !event)
        return (
            <div className="event-page">
                {error || "Event not found"}
            </div>
        );

    /* =====================
       RENDER
    ===================== */
    return (
        <main className="event-page">
            <EventHeader
                event={event}
                activeTab={activeTab}
                rsvp={rsvp}
                onRSVP={sendRSVP}
                onCancelRSVP={cancelRSVP}
                isAdmin={isAdmin}
                onEdit={() => setEditingEvent(event)}
                onDelete={deleteEvent}
            />

            <section className="event-content">
                {/* OVERVIEW */}
                {activeTab === "overview" && (
                    <div className="event-overview">
                        <h3>Description</h3>
                        <p>{event.content || "No description provided."}</p>
                    </div>
                )}

                {/* POSTS */}
                {activeTab === "posts" && (
                    <PostFeed eventId={event.id} />
                )}

                {/* ATTENDEES */}
                {activeTab === "attendees" && (
                    <div className="event-attendees">
                        <div className="attendee-search">
                            <input
                                type="text"
                                placeholder="Search attendees…"
                                value={attendeeQuery}
                                onChange={(e) =>
                                    setAttendeeQuery(e.target.value)
                                }
                            />
                        </div>

                        {attendeesLoading ? (
                            <div className="muted">
                                Loading attendees…
                            </div>
                        ) : (
                            <div className="event-attendees-grid">
                                {/* GOING */}
                                <div className="attendee-column">
                                    <h3 className="attendee-heading">
                                        Going ({filteredGoing.length})
                                    </h3>

                                    {filteredGoing.length === 0 ? (
                                        <div className="muted">
                                            No matches.
                                        </div>
                                    ) : (
                                        filteredGoing.map((a) => (
                                            <div
                                                key={a.id}
                                                className={`attendee-row ${
                                                    user &&
                                                    a.username ===
                                                    user.username
                                                        ? "is-me"
                                                        : ""
                                                }`}
                                            >
                                                <div className="avatar">
                                                    {a.username[0].toUpperCase()}
                                                </div>
                                                <div className="name">
                                                    {a.username}
                                                    {user &&
                                                        a.username ===
                                                        user.username && (
                                                            <span className="you-badge">
                                                                You
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* MAYBE */}
                                <div className="attendee-column">
                                    <h3 className="attendee-heading">
                                        Maybe ({filteredMaybe.length})
                                    </h3>

                                    {filteredMaybe.length === 0 ? (
                                        <div className="muted">
                                            No matches.
                                        </div>
                                    ) : (
                                        filteredMaybe.map((a) => (
                                            <div
                                                key={a.id}
                                                className={`attendee-row ${
                                                    user &&
                                                    a.username ===
                                                    user.username
                                                        ? "is-me"
                                                        : ""
                                                }`}
                                            >
                                                <div className="avatar">
                                                    {a.username[0].toUpperCase()}
                                                </div>
                                                <div className="name">
                                                    {a.username}
                                                    {user &&
                                                        a.username ===
                                                        user.username && (
                                                            <span className="you-badge">
                                                                You
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* EDIT MODAL */}
            {editingEvent && (
                <EditEventModal
                    event={editingEvent}
                    onSave={saveEvent}
                    onClose={() => setEditingEvent(null)}
                />
            )}
        </main>
    );
}
