import { useState } from "react";

export default function EditEventModal({ event, onSave, onClose }) {
    const normalize = (v) => (v ? v.slice(0, 16) : "");

    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: event.title || "",
        content: event.content || "",
        location: event.location || "",
        startAt: normalize(event.startAt),
        endAt: normalize(event.endAt),
        tags: (event.tags || []).map(t => t.name).join(", ")
    });

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);

        await onSave({
            title: form.title.trim(),
            content: form.content.trim(),
            location: form.location.trim(),
            startAt: form.startAt,
            endAt: form.endAt || null,
            tags: form.tags
                ? form.tags.split(",").map(t => t.trim()).filter(Boolean)
                : []
        });

        setSaving(false);
    };

    return (
        <div style={s.backdrop}>
            <div style={s.modal}>
                <h3>Edit Event</h3>

                <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
                    <input
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        required
                        placeholder="Title"
                        style={s.input}
                    />

                    <textarea
                        value={form.content}
                        onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                        rows={4}
                        placeholder="Description"
                        style={s.textarea}
                    />

                    <input
                        value={form.location}
                        onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                        placeholder="Location"
                        style={s.input}
                    />

                    <input
                        type="datetime-local"
                        value={form.startAt}
                        onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
                        required
                        style={s.input}
                    />

                    <input
                        type="datetime-local"
                        value={form.endAt}
                        onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
                        style={s.input}
                    />

                    <input
                        placeholder="Tags (comma separated)"
                        value={form.tags}
                        onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                        style={s.input}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={s.cancelBtn}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={s.saveBtn}
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

const s = {
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
        width: 520
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
    cancelBtn: {
        padding: "6px 10px",
        background: "#ccc",
        border: "none",
        borderRadius: 6
    },
    saveBtn: {
        padding: "6px 10px",
        background: "#0b57d0",
        color: "#fff",
        border: "none",
        borderRadius: 6
    }
};
