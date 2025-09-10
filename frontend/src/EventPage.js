// frontend/src/EventDetail.jsx
import { useEffect, useState } from "react";

export default function EventDetail() {
    const [event, setEvent] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    const id = (() => {
        const m = (window.location.hash || "").match(/^#\/event\/(\d+)/i);
        return m ? Number(m[1]) : null;
    })();

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/events/${id}`);
                if (!res.ok) throw new Error(`Not found (${res.status})`);
                const body = await res.json();
                setEvent(body);
                setErr("");
            } catch (e) {
                setErr(e.message || "Failed to load");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (!id) return <div style={{ padding: 20 }}><a href="#/events">← Back</a></div>;

    return (
        <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
            <a href="#/events" style={styles.back}>← Back to Events</a>
            {loading && <p>Loading…</p>}
            {err && <p style={{ color: "red" }}>{err}</p>}
            {event && (
                <div style={styles.card}>
                    <h2 style={{ marginTop: 0 }}>{event.name}</h2>
                    <div style={{ opacity: .8, marginBottom: 8 }}>
                        {event.startAt ? new Date(event.startAt).toLocaleString() : ""}
                        {event.endAt ? ` — ${new Date(event.endAt).toLocaleString()}` : ""}
                    </div>
                    {event.location && <div style={{ marginBottom: 10 }}><strong>Location:</strong> {event.location}</div>}
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{event.description}</div>
                </div>
            )}
        </div>
    );
}

const styles = {
    back: { textDecoration: "none", border: "1px solid #ccc", padding: "6px 10px", borderRadius: 6, background: "#f8f8f8", color: "#333" },
    card: { background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 10 }
};
