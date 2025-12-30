import { useState } from "react";


export default function EditEventModal({ event, onSave, onClose }) {
    const normalize = (v) => (v ? v.slice(0, 16) : "");

    const [title, setTitle] = useState(event.title || "");
    const [content, setContent] = useState(event.content || "");
    const [location, setLocation] = useState(event.location || "");
    const [startAt, setStartAt] = useState(normalize(event.startAt));
    const [endAt, setEndAt] = useState(normalize(event.endAt));
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);

        await onSave({
            title,
            content,
            location,
            startAt,
            endAt: endAt || null
        });

        setSaving(false);
    };

    return (
        <div style={s.backdrop}>
            <div style={s.modal}>
                <h3>Edit Event</h3>

                <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="Title"
                        style={s.input}
                    />

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        placeholder="Description"
                        style={s.textarea}
                    />

                    <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location"
                        style={s.input}
                    />

                    <input
                        type="datetime-local"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        required
                        style={s.input}
                    />

                    <input
                        type="datetime-local"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
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
