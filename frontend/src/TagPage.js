import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function TagPage() {
    const { name } = useParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        fetch(`/api/tags/${encodeURIComponent(name)}/events`)
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [name]);

    if (loading) {
        return <div style={{ padding: 20 }}>Loading…</div>;
    }

    return (
        <div style={{ padding: "24px", maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ marginBottom: 16 }}>#{name}</h2>

            {events.length === 0 ? (
                <p>No events found for this tag.</p>
            ) : (
                events.map(event => (
                    <EventRow key={event.id} event={event} />
                ))
            )}
        </div>
    );
}

function EventRow({ event }) {
    return (
        <a
            href={event.url}
            style={{
                display: "block",
                padding: "12px 16px",
                marginBottom: 8,
                borderRadius: 6,
                background: "#1f2933",
                color: "#fff",
                textDecoration: "none"
            }}
        >
            <div style={{ fontSize: 15, fontWeight: 600 }}>
                {event.title}
            </div>

            {event.subtitle && (
                <div style={{ fontSize: 12, color: "#9aa0a6" }}>
                    {event.subtitle}
                </div>
            )}
        </a>
    );
}
