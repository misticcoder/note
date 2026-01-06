import { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "./AuthContext";
import EventHeader from "./EventHeader";
import PostFeed from "./Post/PostFeed";
import EditEventModal from "./Events/EditEventModal";
import StarRating from "./components/StarRating";
import "./styles/events.css";
import EventCommentSection from "./Events/EventCommentSection";

export default function EventPage() {
    const { user } = useContext(AuthContext);

    /* =====================
       BASIC STATE
    ===================== */
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* =====================
       ADMIN
    ===================== */
    const [editingEvent, setEditingEvent] = useState(null);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    /* =====================
       RSVP
    ===================== */
    const [rsvp, setRsvp] = useState(null);
    const [counts, setCounts] = useState({ going: 0, maybe: 0 });

    /* =====================
       ATTENDEES
    ===================== */
    const [goingAttendees, setGoingAttendees] = useState([]);
    const [maybeAttendees, setMaybeAttendees] = useState([]);
    const [attendeesLoading, setAttendeesLoading] = useState(false);
    const [attendeeQuery, setAttendeeQuery] = useState("");

    const [hash, setHash] = useState(window.location.hash);



    useEffect(() => {
        const onHashChange = () => setHash(window.location.hash);
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    /* =====================
       ⭐ RATING
    ===================== */
    const [rating, setRating] = useState({
        average: 0,
        count: 0,
        myRating: null,
    });

    /* =====================
       ROUTING
    ===================== */
    const { eventId, activeTab } = useMemo(() => {
        const m = (hash || "").match(/^#\/events\/(\d+)(?:\/(\w+))?/);
        return {
            eventId: m ? Number(m[1]) : null,
            activeTab: m?.[2] || "overview",
        };
    }, [hash]);


    /* =====================
       EVENT STATUS (JS)
    ===================== */
    const eventStatus = useMemo(() => {
        if (!event?.startAt) return "UPCOMING";

        const now = new Date();
        const start = new Date(event.startAt);
        const end = event.endAt
            ? new Date(event.endAt)
            : new Date(start.getTime() + 2 * 60 * 60 * 1000);

        if (now >= start && now <= end) return "LIVE";
        if (now > end) return "ENDED";
        return "UPCOMING";
    }, [event]);

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
       ⭐ FETCH RATING
       - Always fetch average/count
       - If logged in, also fetch myRating
    ===================== */
    useEffect(() => {
        if (!eventId) return;

        const url = user
            ? `/api/events/${eventId}/rating?requesterEmail=${encodeURIComponent(user.email)}`
            : `/api/events/${eventId}/rating`;

        fetch(url)
            .then(r => r.json())
            .then(setRating)
            .catch(() => {});
    }, [eventId, user]);


    /* =====================
       RSVP ACTIONS
    ===================== */
    const sendRSVP = async (status) => {
        if (!user) return;

        const res = await fetch(
            `/api/events/${eventId}/rsvp?requesterEmail=${encodeURIComponent(
                user.email
            )}&status=${status}`,
            { method: "POST" }
        );
        if (!res.ok) {
            alert("Unable to update RSVP");
            return;
        }

        setRsvp(status);
        setCounts(
            await fetch(`/api/events/${eventId}/attendance`).then((r) => r.json())
        );
    };

    const cancelRSVP = async () => {
        if (!user) return;

        const res = await fetch(
            `/api/events/${eventId}/rsvp?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            { method: "DELETE" }
        );

        if (!res.ok) {
            alert("Unable to cancel RSVP");
            return;
        }

        setRsvp(null);
        setCounts(
            await fetch(`/api/events/${eventId}/attendance`).then((r) => r.json())
        );
    };

    /* =====================
       ATTENDEES
    ===================== */
    useEffect(() => {
        if (
            activeTab !== "attendees" ||
            !eventId ||
            goingAttendees.length ||
            maybeAttendees.length
        ) return;


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
                a.username.toLowerCase().includes(attendeeQuery.toLowerCase())
            ),
        [goingAttendees, attendeeQuery]
    );

    const filteredMaybe = useMemo(
        () =>
            maybeAttendees.filter((a) =>
                a.username.toLowerCase().includes(attendeeQuery.toLowerCase())
            ),
        [maybeAttendees, attendeeQuery]
    );

    /* =====================
       ⭐ SUBMIT RATING
    ===================== */
    const submitRating = async (value) => {
        if (!user || !event) return;

        const res = await fetch(
            `/api/events/${event.id}/rating?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating: value }),
            }
        );

        if (!res.ok) {
            alert("Unable to submit rating");
            return;
        }

        // Refresh rating summary + my rating
        const url = `/api/events/${event.id}/rating?requesterEmail=${encodeURIComponent(
            user.email
        )}`;

        const updated = await fetch(url).then((r) => r.json());
        setRating(updated);
    };

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

        if (!window.confirm("Delete this event?")) return;

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
       STATES (AFTER ALL HOOKS)
    ===================== */
    if (loading) return <div className="event-page">Loading…</div>;
    if (error || !event) return <div className="event-page">Event not found</div>;

    /* =====================
       RENDER
    ===================== */
    return (
        <main className="event-page">
            {/* Pass computed status into header so pills/tags are consistent */}
            <EventHeader
                event={{ ...event, status: eventStatus }}
                activeTab={activeTab}
                rsvp={rsvp}
                onRSVP={sendRSVP}
                onCancelRSVP={cancelRSVP}
                isAdmin={isAdmin}
                onEdit={() => setEditingEvent(event)}
                onDelete={deleteEvent}
                canEdit={isAdmin && eventStatus !== "ENDED"}
            />

            <section className="event-content">
                {activeTab === "overview" && (
                    <div className="event-overview">
                        <div className="event-rating">
                            <StarRating
                                value={
                                    rating.myRating !== null
                                        ? rating.myRating
                                        : Math.round(rating.average)
                                }
                                disabled={
                                    !user ||
                                    rsvp !== "GOING" ||
                                    eventStatus !== "ENDED"
                                }
                                onRate={submitRating}
                            />

                            <div className="rating-meta">
                                {rating.count > 0
                                    ? `${rating.average.toFixed(1)} (${rating.count} ratings)`
                                    : "No ratings yet"}
                            </div>

                            {!user && (
                                <div className="rating-hint muted">
                                    Log in to rate this event
                                </div>
                            )}

                            {user && rsvp !== "GOING" && (
                                <div className="rating-hint muted">
                                    Only attendees can rate
                                </div>
                            )}

                            {eventStatus !== "ENDED" && (
                                <div className="rating-hint muted">
                                    Ratings open after the event ends
                                </div>
                            )}
                        </div>


                        <h3>Description</h3>
                        <p style={{margin:"10px"}}>{event.content || "No description provided."}</p>
                        <div>
                            <EventCommentSection
                                eventId={event.id}
                                eventStatus={eventStatus}
                                rsvp={rsvp}
                                comments={event.comments}
                            />
                        </div>
                    </div>

                )}

                {activeTab === "posts" && <PostFeed eventId={event.id} />}

                {activeTab === "attendees" && (
                    <div className="event-attendees">
                        <div className="attendee-search">
                            <input
                                type="text"
                                placeholder="Search attendees…"
                                value={attendeeQuery}
                                onChange={(e) => setAttendeeQuery(e.target.value)}
                            />
                        </div>

                        {attendeesLoading ? (
                            <div className="muted">Loading attendees…</div>
                        ) : (
                            <div className="event-attendees-grid">
                                {/* GOING */}
                                <div className="attendee-column">
                                    <h3 className="attendee-heading">
                                        Going ({filteredGoing.length})
                                    </h3>

                                    {filteredGoing.length === 0 ? (
                                        <div className="muted">No matches.</div>
                                    ) : (
                                        filteredGoing.map((a) => (
                                            <div
                                                key={a.id}
                                                className={`attendee-row ${
                                                    user && a.username === user.username
                                                        ? "is-me"
                                                        : ""
                                                }`}
                                            >
                                                <div className="avatar">
                                                    {a.username[0].toUpperCase()}
                                                </div>
                                                <div className="name">
                                                    {a.username}
                                                    {user && a.username === user.username && (
                                                        <span className="you-badge">You</span>
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
                                        <div className="muted">No matches.</div>
                                    ) : (
                                        filteredMaybe.map((a) => (
                                            <div
                                                key={a.id}
                                                className={`attendee-row ${
                                                    user && a.username === user.username
                                                        ? "is-me"
                                                        : ""
                                                }`}
                                            >
                                                <div className="avatar">
                                                    {a.username[0].toUpperCase()}
                                                </div>
                                                <div className="name">
                                                    {a.username}
                                                    {user && a.username === user.username && (
                                                        <span className="you-badge">You</span>
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















