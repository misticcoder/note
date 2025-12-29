import { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "./AuthContext";
import EventHeader from "./EventHeader";
import PostFeed from "./Post/PostFeed";
import "./styles/events.css";

export default function EventPage() {
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [rsvp, setRsvp] = useState(null);
    const [counts, setCounts] = useState({ going: 0, maybe: 0 });

    const [attendees, setAttendees] = useState([]);
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
            activeTab: m?.[2] || "overview"
        };
    }, [window.location.hash]);

    useEffect(() => {
        if (activeTab !== "attendees" || !eventId) return;

        setAttendeesLoading(true);

        Promise.all([
            fetch(`/api/events/${eventId}/attendees?status=GOING`).then(r => r.json()),
            fetch(`/api/events/${eventId}/attendees?status=MAYBE`).then(r => r.json())
        ])
            .then(([going, maybe]) => {
                setGoingAttendees(Array.isArray(going) ? going : []);
                setMaybeAttendees(Array.isArray(maybe) ? maybe : []);
            })
            .finally(() => setAttendeesLoading(false));

    }, [activeTab, eventId]);

    const filteredGoing = goingAttendees.filter(a =>
        a.username.toLowerCase().includes(attendeeQuery.toLowerCase())
    );

    const filteredMaybe = maybeAttendees.filter(a =>
        a.username.toLowerCase().includes(attendeeQuery.toLowerCase())
    );



    /* =====================
       FETCH EVENT
    ===================== */
    useEffect(() => {
        if (!eventId) return;

        fetch(`/api/events/${eventId}`)
            .then(r => {
                if (!r.ok) throw new Error("Event not found");
                return r.json();
            })
            .then(setEvent)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [eventId]);

    /* =====================
       RSVP + COUNTS
    ===================== */
    useEffect(() => {
        if (!eventId || !user) return;

        fetch(`/api/events/${eventId}/rsvp?requesterEmail=${encodeURIComponent(user.email)}`)
            .then(r => r.json())
            .then(d => setRsvp(d.status || null))
            .catch(() => {});

        fetch(`/api/events/${eventId}/attendance`)
            .then(r => r.json())
            .then(setCounts)
            .catch(() => {});
    }, [eventId, user]);

    /* =====================
       RSVP ACTIONS
    ===================== */
    const sendRSVP = async (status) => {
        await fetch(
            `/api/events/${eventId}/rsvp?requesterEmail=${encodeURIComponent(user.email)}&status=${status}`,
            { method: "POST" }
        );
        setRsvp(status);
        setCounts(await fetch(`/api/events/${eventId}/attendance`).then(r => r.json()));
    };

    const cancelRSVP = async () => {
        await fetch(
            `/api/events/${eventId}/rsvp?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "DELETE" }
        );
        setRsvp(null);
        setCounts(await fetch(`/api/events/${eventId}/attendance`).then(r => r.json()));
    };

    /* =====================
       ATTENDEES TAB
    ===================== */
    useEffect(() => {
        if (activeTab !== "attendees" || !eventId) return;

        setAttendeesLoading(true);
        fetch(`/api/events/${eventId}/attendees?status=GOING`)
            .then(r => r.json())
            .then(setAttendees)
            .finally(() => setAttendeesLoading(false));
    }, [activeTab, eventId]);

    if (loading) return <div className="event-page">Loading…</div>;
    if (error || !event) return <div className="event-page">{error || "Event not found"}</div>;

    return (
        <main className="event-page">
            <EventHeader
                event={event}
                activeTab={activeTab}
                rsvp={rsvp}
                onRSVP={sendRSVP}
                onCancelRSVP={cancelRSVP}
            />

            <section className="event-content">
                {activeTab === "overview" && (
                    <div className="event-overview">
                        <h3>Description</h3>
                        <p>{event.content || "No description provided."}</p>
                    </div>
                )}

                {activeTab === "attendees" && (
                    <div className="event-attendees">

                        {/* SEARCH */}
                        <div className="attendee-search">
                            <input
                                type="text"
                                placeholder="Search attendees…"
                                value={attendeeQuery}
                                onChange={e => setAttendeeQuery(e.target.value)}
                            />
                        </div>

                        {attendeesLoading && (
                            <div className="muted">Loading attendees…</div>
                        )}

                        {!attendeesLoading && (
                            <div className="event-attendees-grid">

                                {/* GOING */}
                                <div className="attendee-column">
                                    <h3 className="attendee-heading">
                                        Going ({filteredGoing.length})
                                    </h3>

                                    {filteredGoing.length === 0 ? (
                                        <div className="muted">No matches.</div>
                                    ) : (
                                        filteredGoing.map(a => (
                                            <div
                                                key={a.id}
                                                className={`attendee-row ${user && a.username === user.username ? "is-me" : ""}`}
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
                                        filteredMaybe.map(a => (
                                            <div
                                                key={a.id}
                                                className={`attendee-row ${user && a.username === user.username ? "is-me" : ""}`}
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
        </main>
    );
}
