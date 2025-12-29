import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../AuthContext";
import ReferencePicker from "./ReferencePicker";

export default function EditPostModal({ post, onClose, onSave }) {
    const { user } = useContext(AuthContext);

    const [content, setContent] = useState("");
    const [orderedImages, setOrderedImages] = useState([]);
    const [removeImageIds, setRemoveImageIds] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);
    const [references, setReferences] = useState([]);

    // datetime-local needs: "YYYY-MM-DDTHH:mm"
    const [publishAt, setPublishAt] = useState(
        post.publishAt ? String(post.publishAt).slice(0, 16) : ""
    );

    /* ===================== SYNC POST ===================== */

    useEffect(() => {
        setContent(post.content || "");

        setOrderedImages(
            post.images?.map(img => ({
                id: img.id,
                url: img.url,
            })) || []
        );

        setReferences(Array.isArray(post.references) ? post.references : []);

        setRemoveImageIds([]);
        setNewImages([]);
        setNewPreviews([]);

        setPublishAt(post.publishAt ? String(post.publishAt).slice(0, 16) : "");
    }, [post]);

    /* ===================== DRAG & DROP ===================== */

    const onDragStart = (e, index) => {
        e.dataTransfer.setData("dragIndex", index);
    };

    const onDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = Number(e.dataTransfer.getData("dragIndex"));
        if (dragIndex === dropIndex) return;

        const updated = [...orderedImages];
        const [moved] = updated.splice(dragIndex, 1);
        updated.splice(dropIndex, 0, moved);

        setOrderedImages(updated);
    };

    const onDragOver = (e) => e.preventDefault();

    /* ===================== CLEANUP PREVIEWS ===================== */

    useEffect(() => {
        return () => {
            newPreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [newPreviews]);

    /* ===================== SAVE ===================== */

    const handleSave = () => {
        const trimmed = content.trim();

        if (
            !trimmed &&
            orderedImages.length === 0 &&
            newImages.length === 0 &&
            references.length === 0
        ) {
            alert("Post cannot be empty");
            return;
        }

        // If admin sets a past publishAt, it will publish immediately
        if (user?.role === "ADMIN" && post.publishAt !== null && publishAt) {
            const dt = new Date(publishAt);
            if (!Number.isNaN(dt.getTime()) && dt < new Date()) {
                const ok = window.confirm(
                    "This publish time is in the past. The announcement will publish immediately. Continue?"
                );
                if (!ok) return;
            }
        }

        onSave({
            content: trimmed,
            removeImageIds,
            newImages,
            imageOrder: orderedImages.map(img => String(img.id)),
            references,

            // ✅ send publishAt for admin scheduled announcements
            // - empty string => clear schedule (publish immediately)
            // - value => schedule/reschedule
            publishAt: user?.role === "ADMIN" ? publishAt : undefined,
        });
    };

    /* ===================== RENDER ===================== */

    const showScheduleControl =
        user?.role === "ADMIN" && post.publishAt !== null; // only for announcements/scheduled posts you intend to edit

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h3>Edit Post</h3>

                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    maxLength={500}
                />

                <ReferencePicker
                    references={references}
                    setReferences={setReferences}
                />

                {/* ===================== EXISTING IMAGES ===================== */}
                {orderedImages.length > 0 && (
                    <div className="image-grid">
                        {orderedImages.map((img, i) => (
                            <div
                                key={img.id}
                                className="image-item draggable"
                                draggable
                                onDragStart={(e) => onDragStart(e, i)}
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, i)}
                            >
                                <img src={img.url} alt="" />

                                <button
                                    className="remove-image"
                                    draggable={false}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        const id = String(img.id);

                                        setRemoveImageIds(prev =>
                                            prev.includes(id) ? prev : [...prev, id]
                                        );

                                        setOrderedImages(prev =>
                                            prev.filter(i => String(i.id) !== id)
                                        );
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ===================== NEW IMAGE PREVIEWS ===================== */}
                {newPreviews.length > 0 && (
                    <div className="image-grid">
                        {newPreviews.map((src, i) => (
                            <div key={i} className="image-item">
                                <img src={src} alt="" />
                                <button
                                    className="remove-image"
                                    onClick={() => {
                                        setNewImages(prev => prev.filter((_, idx) => idx !== i));
                                        setNewPreviews(prev => prev.filter((_, idx) => idx !== i));
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ===================== ADD IMAGES ===================== */}
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;

                        const total = orderedImages.length + newImages.length + files.length;
                        if (total > 4) {
                            alert("Maximum 4 images per post");
                            e.target.value = null;
                            return;
                        }

                        setNewImages(prev => [...prev, ...files]);
                        setNewPreviews(prev => prev.concat(files.map(f => URL.createObjectURL(f))));
                        e.target.value = null;
                    }}
                />

                {/* ===================== SCHEDULE (ADMIN) ===================== */}
                {showScheduleControl && (
                    <div className="edit-schedule">
                        <label>
                            Publish at:
                            <input
                                type="datetime-local"
                                value={publishAt}
                                onChange={e => setPublishAt(e.target.value)}
                            />
                        </label>
                        <div className="muted" style={{ marginTop: 6 }}>
                            Clear the field to publish immediately.
                        </div>
                    </div>
                )}

                {/* ===================== ACTIONS ===================== */}
                <div className="modal-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}
