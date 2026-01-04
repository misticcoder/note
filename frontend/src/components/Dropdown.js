import { useEffect, useRef, useState } from "react";
import "../styles/dropdown.css";

export default function Dropdown({ onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    return (
        <div
            className="row-actions"
            ref={ref}
            onClick={(e) => e.stopPropagation()}
        >
            {/* 3 dots */}
            <button
                className="dots-btn"
                aria-label="Actions"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
            >
                ⋮
            </button>

            {open && (
                <div
                    className="actions-menu"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            onEdit();
                        }}
                    >
                        Edit
                    </button>

                    <button
                        className="danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            onDelete();
                        }}
                    >
                        Delete
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
