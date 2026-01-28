import { useEffect, useState } from "react";
import "../styles/modal.css";

export default function EditEventModal({
                                           event,
                                           clubs = [],
                                           onSave,
                                           onClose
                                       }) {
    if (!event) return null;

    const normalize = (v) => (v ? v.slice(0, 16) : "");

    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: "",
        content: "",
        location: "",
        startAt: "",
        endAt: "",
        clubId: "",
        tags: "",
        visibility: "PUBLIC"
    });

    /**
     * 🔒 Lock club selector if event already belongs to a club
     */
    const lockClubSelector = event.clubId != null;

    /**
     * Initialise / sync form when event changes
     * (also handles clubs loading late)
     */
    useEffect(() => {
        if (!event) return;

        setForm({
            title: event.title || "",
            content: event.content || "",
            location: event.location || "",
            startAt: normalize(event.startAt),
            endAt: normalize(event.endAt),
            clubId: event.clubId != null ? String(event.clubId) : "",
            tags: (event.tags || [])
                .map((t) => (typeof t === "string" ? t : t.name))
                .join(", "),
            visibility: event.visibility || "PUBLIC"
        });
    }, [event, clubs]);

    const submit = async (e) => {
        e.preventDefault();
        if (saving) return;

        if (!form.title.trim()) return;

        setSaving(true);

        const ok = await onSave({
            title: form.title.trim(),
            content: form.content.trim(),
            location: form.location.trim(),
            startAt: form.startAt,
            endAt: form.endAt || null,
            clubId: form.clubId ? Number(form.clubId) : null,
            tags: form.tags
                ? [...new Set(
                    form.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                )]
                : [],
            visibility: form.visibility
        });

        setSaving(false);

        if (ok !== false) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <h3>Edit Event</h3>

                <form onSubmit={submit} className="modal-form">
                    {/* 🔒 Club selector (locked for existing club events) */}
                    <select
                        value={form.clubId}
                        disabled={lockClubSelector || clubs.length === 0}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, clubId: e.target.value }))
                        }
                        title={
                            lockClubSelector
                                ? "This event already belongs to a club and cannot be reassigned"
                                : ""
                        }
                    >
                        <option value="">No Club (Independent)</option>
                        {clubs.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    {lockClubSelector && (
                        <small style={{ color: "#666" }}>
                            This event belongs to a club and cannot be changed.
                        </small>
                    )}

                    {/* Title */}
                    <input
                        value={form.title}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, title: e.target.value }))
                        }
                        required
                        placeholder="Title"
                    />

                    {/* Description */}
                    <textarea
                        value={form.content}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, content: e.target.value }))
                        }
                        rows={4}
                        placeholder="Description"
                    />

                    {/* Location */}
                    <input
                        value={form.location}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, location: e.target.value }))
                        }
                        placeholder="Location"
                    />

                    {/* Start time */}
                    <input
                        type="datetime-local"
                        value={form.startAt}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, startAt: e.target.value }))
                        }
                        required
                    />

                    {/* End time */}
                    <input
                        type="datetime-local"
                        value={form.endAt}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, endAt: e.target.value }))
                        }
                    />

                    {/* Tags */}
                    <input
                        placeholder="Tags (comma separated)"
                        value={form.tags}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, tags: e.target.value }))
                        }
                    />

                    {/* Visibility */}
                    <select
                        value={form.visibility}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, visibility: e.target.value }))
                        }
                    >
                        <option value="PUBLIC">Visible to everyone</option>
                        <option value="CLUB_MEMBERS">Club members only</option>
                    </select>

                    {/* Actions */}
                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cancelBtn"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="saveBtn"
                            disabled={saving}
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
