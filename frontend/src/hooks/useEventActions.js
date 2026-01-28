import { useState } from "react";
import { apiFetch } from "../api";

export function useEventActions({ user, setEvents }) {
    const [editingEvent, setEditingEvent] = useState(null);

    const toIso = (v) => (v ? new Date(v).toISOString() : null);

    const deleteEvent = async (ev) => {
        if (!user) return;
        if (!window.confirm("Delete this event?")) return;

        const res = await apiFetch(
            `/api/events/${ev.id}?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "DELETE" }
        );

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            alert(body.message || "Delete failed");
            return;
        }

        setEvents(prev => prev.filter(e => e.id !== ev.id));
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

        setEvents(prev =>
            prev.map(e => (e.id === body.id ? body : e))
        );

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
