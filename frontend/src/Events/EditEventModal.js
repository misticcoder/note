import { useState } from "react";

export default function EditEventModal({
                                           event,
                                           clubs = [],
                                           onSave,
                                           onClose
                                       }) {
    // Defensive guard
    if (!event) return null;

    const normalize = (v) => (v ? v.slice(0, 16) : "");

    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: event.title || "",
        content: event.content || "",
        location: event.location || "",
        startAt: normalize(event.startAt),
        endAt: normalize(event.endAt),
        clubId: event.club?.id ? String(event.club.id) : "",
        tags: (event.tags || [])
            .map((t) => (typeof t === "string" ? t : t.name))
            .join(", ")
    });

    const submit = async (e) => {
        e.preventDefault();
        if (saving) return;

        if (!form.title.trim()) return;

        setSaving(true);

        await onSave({
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
                : []
        });

        setSaving(false);
        onClose();
    };

    return (
        <div style={styles.backdrop} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3>Edit Event</h3>

                <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
                    {/* Club selector */}
                    <select
                        value={form.clubId}
                        disabled={clubs.length === 0}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, clubId: e.target.value }))
                        }
                    >
                        {clubs.length === 0 ? (
                            <option value="">Loading clubs…</option>
                        ) : (
                            <>
                                <option value="">No Club (Independent)</option>
                                {clubs.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>

                    {/* Title */}
                    <input
                        value={form.title}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, title: e.target.value }))
                        }
                        required
                        placeholder="Title"
                        style={styles.input}
                    />

                    {/* Description */}
                    <textarea
                        value={form.content}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, content: e.target.value }))
                        }
                        rows={4}
                        placeholder="Description"
                        style={styles.textarea}
                    />

                    {/* Location */}
                    <input
                        value={form.location}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, location: e.target.value }))
                        }
                        placeholder="Location"
                        style={styles.input}
                    />

                    {/* Start time */}
                    <input
                        type="datetime-local"
                        value={form.startAt}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, startAt: e.target.value }))
                        }
                        required
                        style={styles.input}
                    />

                    {/* End time */}
                    <input
                        type="datetime-local"
                        value={form.endAt}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, endAt: e.target.value }))
                        }
                        style={styles.input}
                    />

                    {/* Tags */}
                    <input
                        placeholder="Tags (comma separated)"
                        value={form.tags}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, tags: e.target.value }))
                        }
                        style={styles.input}
                    />

                    {/* Actions */}
                    <div style={styles.actions}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={styles.cancelBtn}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={styles.saveBtn}
                            disabled={saving}
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* =====================
   STYLES
===================== */

const styles = {
    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
    },
    modal: {
        background: "#fff",
        padding: 20,
        borderRadius: 8,
        width: 520,
        maxHeight: "90vh",
        overflowY: "auto"
    },
    input: {
        padding: "8px 10px",
        border: "1px solid #ccc",
        borderRadius: 6
    },
    textarea: {
        padding: "8px 10px",
        border: "1px solid #ccc",
        borderRadius: 6
    },
    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8
    },
    cancelBtn: {
        padding: "6px 10px",
        background: "#ccc",
        border: "none",
        borderRadius: 6,
        cursor: "pointer"
    },
    saveBtn: {
        padding: "6px 12px",
        background: "#0b57d0",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        cursor: "pointer"
    }
};
