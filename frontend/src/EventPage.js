import {useEffect, useState, useContext, useMemo, useRef, useCallback} from "react";
import { AuthContext } from "./AuthContext";
import EventHeader from "./EventHeader";
import PostFeed from "./Post/PostFeed";
import EditEventModal from "./Events/EditEventModal";
import StarRating from "./components/StarRating";
import "./styles/events.css";
import "./styles/index.css";
import EventCommentSection from "./Events/EventCommentSection";
import EventAttendanceQR from "./components/EventAttendanceQR";
import {apiFetch} from "./api";
import {useEventActions} from "./hooks/useEventActions";

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
    const [attendedAttendees, setAttendedAttendees] = useState([]);
    const [attendeesLoading, setAttendeesLoading] = useState(false);
    const [attendeeQuery, setAttendeeQuery] = useState("");

    const [hash, setHash] = useState(window.location.hash);

    const [attendanceCode, setAttendanceCode] = useState(null);
    const [manualCode, setManualCode] = useState("");
    const [checkingIn, setCheckingIn] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState(null);

    const {
        editingEvent,
        setEditingEvent,
        saveEvent,
        deleteEvent
    } = useEventActions({
        user,
        setEvent
    });


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

        // IMPORTANT: wait until auth is resolved
        if (user === undefined) return;

        setLoading(true);
        setError("");

        const url = user?.email
            ? `/api/events/${eventId}?requesterEmail=${encodeURIComponent(user.email)}`
            : `/api/events/${eventId}`;

        apiFetch(url)
            .then(async (r) => {
                const body = await r.json().catch(() => ({}));

                if (r.status === 403) {
                    throw new Error(body.message || "Members only event");
                }
                if (r.status === 404) {
                    throw new Error(body.message || "Event not found");
                }
                if (!r.ok) {
                    throw new Error("Failed to load event");
                }

                return body;
            })
            .then(setEvent)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [eventId, user]);

    /* =====================
       RSVP + COUNTS
    ===================== */
    useEffect(() => {
        if (!eventId || user === undefined) return;
        if (!user) return; // guest

        apiFetch(
            `/api/events/${eventId}/rsvp?requesterEmail=${encodeURIComponent(
                user.email
            )}`
        )
            .then((r) => r.json())
            .then((d) => {
                setRsvp(d.status || null);
                setAttendanceStatus(d.status || null);
            })
            .catch(() => {});

        apiFetch(`/api/events/${eventId}/attendance`)
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

        apiFetch(url)
            .then(r => r.json())
            .then(setRating)
            .catch(() => {});
    }, [eventId, user]);

    /* =====================
       ATTENDANCE CODE SUBMISSION
    ===================== */
    const submitAttendanceCode = useCallback(async (code) => {
        if (!user || !eventId || !code) return;

        try {
            setCheckingIn(true);

            const res = await apiFetch(
                `/api/events/${eventId}/check-in?requesterEmail=${encodeURIComponent(
                    user.email
                )}&code=${encodeURIComponent(code.trim())}`,
                { method: "POST" }
            );

            if (!res.ok) {
                throw new Error("Invalid code");
            }

            setAttendanceStatus("ATTENDED");
            alert("✓ Attendance recorded");
            window.location.hash = `#/events/${eventId}`;
        } catch {
            alert("✗ Invalid or expired attendance code");
        } finally {
            setCheckingIn(false);
        }
    }, [user, eventId]);

    /* =====================
       QR CODE CHECK-IN
    ===================== */
    const checkedInRef = useRef(false);

    useEffect(() => {
        if (activeTab !== "check-in" || !eventId || !user) return;

        if (checkedInRef.current) return;
        checkedInRef.current = true;

        const queryString = window.location.hash.split("?")[1] || "";
        const params = new URLSearchParams(queryString);
        const code = params.get("code");

        if (!code) {
            setError("Invalid QR code");
            return;
        }

        submitAttendanceCode(code);
    }, [activeTab, eventId, user, submitAttendanceCode]);

    /* =====================
       RSVP ACTIONS
    ===================== */
    const sendRSVP = async (status) => {
        if (!user) return;

        const res = await apiFetch(
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

        try {
            const updatedCounts = await apiFetch(`/api/events/${eventId}/attendance`).then((r) => r.json());
            setCounts(updatedCounts);
        } catch {
            // Silently fail if count update fails
        }
    };

    const cancelRSVP = async () => {
        if (!user) return;

        const res = await apiFetch(
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

        try {
            const updatedCounts = await apiFetch(`/api/events/${eventId}/attendance`).then((r) => r.json());
            setCounts(updatedCounts);
        } catch {
            // Silently fail if count update fails
        }
    };

    /* =====================
       ATTENDEES
    ===================== */
    const attendeesFetchedRef = useRef(false);

    useEffect(() => {
        if (activeTab !== "attendees" || !eventId) return;

        // Only fetch once per event
        if (attendeesFetchedRef.current) return;
        attendeesFetchedRef.current = true;

        setAttendeesLoading(true);

        Promise.all([
            apiFetch(`/api/events/${eventId}/attendees?status=ATTENDED`).then(r => r.json()),
            apiFetch(`/api/events/${eventId}/attendees?status=GOING`).then(r => r.json()),
            apiFetch(`/api/events/${eventId}/attendees?status=MAYBE`).then(r => r.json()),
        ])
            .then(([attended, going, maybe]) => {
                setAttendedAttendees(Array.isArray(attended) ? attended : []);
                setGoingAttendees(Array.isArray(going) ? going : []);
                setMaybeAttendees(Array.isArray(maybe) ? maybe : []);
            })
            .catch(() => {
                // Silently fail - attendees will remain empty
            })
            .finally(() => setAttendeesLoading(false));
    }, [activeTab, eventId]);

    // Reset attendees when eventId changes
    useEffect(() => {
        attendeesFetchedRef.current = false;
        setGoingAttendees([]);
        setMaybeAttendees([]);
        setAttendedAttendees([]);
    }, [eventId]);

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

    const filteredAttended = useMemo(
        () =>
            attendedAttendees.filter((a) =>
                a.username.toLowerCase().includes(attendeeQuery.toLowerCase())
            ),
        [attendedAttendees, attendeeQuery]
    );

    /* =====================
       ⭐ SUBMIT RATING
    ===================== */
    const submitRating = async (value) => {
        if (!user || !event) return;

        const res = await apiFetch(
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
        try {
            const url = `/api/events/${event.id}/rating?requesterEmail=${encodeURIComponent(
                user.email
            )}`;
            const updated = await apiFetch(url).then((r) => r.json());
            setRating(updated);
        } catch {
            // Silently fail if refresh fails
        }
    };


    /* =====================
       ROTATE ATTENDANCE CODE
    ===================== */
    const rotateAttendanceCode = async () => {
        if (!user || !event || attendanceCode) return;

        try {
            const res = await apiFetch(
                `/api/events/${event.id}/attendance-code/rotate?requesterEmail=${encodeURIComponent(
                    user.email
                )}`,
                { method: "POST" }
            );

            if (!res.ok) {
                throw new Error("Failed to generate code");
            }

            const data = await res.json();
            setAttendanceCode(data.attendanceCode);
        } catch {
            alert("Unable to generate attendance code");
        }
    };

    /* =====================
       STATES (AFTER ALL HOOKS)
    ===================== */
    // Auth still restoring → never show terminal state
    if (user === undefined || loading) {
        return <div className="event-page">Loading…</div>;
    }

    // Real error from backend
    if (error) {
        return <div className="event-page">{error}</div>;
    }

    // Auth resolved, no error, but no event
    if (!event) {
        return <div className="event-page">Event not found</div>;
    }

    /* =====================
       RENDER
    ===================== */
    return (
        <div className="page">
            <div className="container">
                {/* Pass computed status into header so pills/tags are consistent */}
                <EventHeader
                    event={{ ...event, status: eventStatus }}
                    activeTab={activeTab}
                    rsvp={rsvp}
                    onRSVP={sendRSVP}
                    onCancelRSVP={cancelRSVP}
                    isAdmin={isAdmin}
                    onEdit={() => setEditingEvent({ ...event })}
                    onDelete={() => deleteEvent(event)}
                    canEdit={isAdmin && eventStatus !== "ENDED"}
                />

                <section className="event-content">
                    {activeTab === "overview" && (
                        <div className="event-overview">
                            {attendanceStatus === "ATTENDED" && (
                                <div className="attendance-confirmed">
                                    ✅ You are checked in
                                </div>
                            )}

                            {user &&
                                !isAdmin &&
                                eventStatus === "LIVE" &&
                                attendanceStatus !== "ATTENDED" && (
                                    <div className="attendance-manual">
                                        <h3>Attendance</h3>

                                        <input
                                            type="text"
                                            placeholder="Enter attendance code"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                            disabled={checkingIn}
                                        />

                                        <button
                                            onClick={() => submitAttendanceCode(manualCode)}
                                            disabled={!manualCode || checkingIn}
                                        >
                                            {checkingIn ? "Checking in…" : "Check in"}
                                        </button>

                                        <div className="muted">
                                            You can also scan the QR code shown by the organiser
                                        </div>
                                    </div>
                                )}

                            <div className="event-rating">
                                {isAdmin && (
                                    <button onClick={rotateAttendanceCode}>
                                        Show Attendance QR
                                    </button>
                                )}

                                {isAdmin && attendanceCode && (
                                    <EventAttendanceQR
                                        eventId={event.id}
                                        attendanceCode={attendanceCode}
                                    />
                                )}

                                {isAdmin && attendanceCode && (
                                    <div className="attendance-code-box">
                                        <div className="attendance-code-label">Attendance Code</div>

                                        <div className="attendance-code">
                                            {attendanceCode}
                                        </div>

                                        <button
                                            onClick={() => navigator.clipboard.writeText(attendanceCode)}
                                        >
                                            Copy code
                                        </button>

                                        <div className="muted">
                                            Students can enter this code manually if they can't scan the QR
                                        </div>
                                    </div>
                                )}

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

                                    {/* ATTENDED */}
                                    <div className="attendee-column attended">
                                        <h3 className="attendee-heading">
                                            Checked in ({filteredAttended.length})
                                        </h3>

                                        {filteredAttended.length === 0 ? (
                                            <div className="muted">No one has checked in yet.</div>
                                        ) : (
                                            filteredAttended.map((a) => (
                                                <div
                                                    key={a.id}
                                                    className={`attendee-row ${
                                                        user && a.username === user.username ? "is-me" : ""
                                                    }`}
                                                >
                                                    <div className="avatar">✓</div>
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

            </div>
        </div>
    );
}