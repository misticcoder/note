import { useEffect, useState } from "react";

export default function EditPostModal({ post, onClose, onSave }) {
    const [content, setContent] = useState("");
    const [orderedImages, setOrderedImages] = useState([]);
    const [removeImageIds, setRemoveImageIds] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);

    /* ===================== SYNC POST ===================== */

    useEffect(() => {
        setContent(post.content || "");

        setOrderedImages(
            post.images?.map(img => ({
                id: img.id,
                url: img.url,
            })) || []
        );

        setRemoveImageIds([]);
        setNewImages([]);
        setNewPreviews([]);
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
        console.log("REMOVE IDS:", removeImageIds);

        if (
            !content.trim() &&
            orderedImages.length === 0 &&
            newImages.length === 0
        ) {
            alert("Post cannot be empty");
            return;
        }

        onSave({
            content,
            removeImageIds,
            newImages,
            imageOrder: orderedImages.map(img => img.id),
        });
    };

    /* ===================== RENDER ===================== */

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h3>Edit Post</h3>

                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    maxLength={500}
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
                                            prev.includes(id)
                                                ? prev
                                                : [...prev, id]
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
                                        setNewImages(prev =>
                                            prev.filter((_, idx) => idx !== i)
                                        );
                                        setNewPreviews(prev =>
                                            prev.filter((_, idx) => idx !== i)
                                        );
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

                        const total =
                            orderedImages.length +
                            newImages.length +
                            files.length;

                        if (total > 4) {
                            alert("Maximum 4 images per post");
                            e.target.value = null;
                            return;
                        }

                        setNewImages(prev => [...prev, ...files]);
                        setNewPreviews(prev =>
                            prev.concat(
                                files.map(f => URL.createObjectURL(f))
                            )
                        );

                        e.target.value = null;
                    }}
                />

                {/* ===================== ACTIONS ===================== */}

                <div className="modal-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}
