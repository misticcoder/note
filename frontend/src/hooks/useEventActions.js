import { useState } from "react";
import { apiFetch } from "../api";

export function useEventActions({ user, setEvents, setEvent }) {
    const [editingEvent, setEditingEvent] = useState(null);

    const toIso = (v) => (v ? new Date(v).toISOString() : null);

    const deleteEvent = async (ev) => {
        if (!user) return;
        if (!window.confirm("Delete this event?")) return;

        const res = await apiFetch(
            `/api/events/${ev.id}?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "DELETE" }
        );

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Delete failed");
            return;
        }

        // 🔁 list page
        if (setEvents) {
            setEvents(prev => prev.filter(e => e.id !== ev.id));
        }

        // 🔁 single page
        if (setEvent) {
            setEvent(null);
            window.location.hash = "#/events";
        }
    };

    const saveEvent = async (updates) => {
        if (!editingEvent || !user) return false;

        const payload = {
            ...updates,
            startAt: toIso(updates.startAt),
            endAt: updates.endAt ? toIso(updates.endAt) : null,
        };

        const res = await apiFetch(
            `/api/events/${editingEvent.id}?requesterEmail=${encodeURIComponent(user.email)}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Update failed");
            return false;
        }

        // 🔁 list page
        if (setEvents) {
            setEvents(prev =>
                prev.map(e => (e.id === body.id ? body : e))
            );
        }

        // 🔁 single page
        if (setEvent) {
            setEvent(body);
        }

        setEditingEvent(null);
        return true;
    };

    return {
        editingEvent,
        setEditingEvent,
        saveEvent,
        deleteEvent,
    };
}
