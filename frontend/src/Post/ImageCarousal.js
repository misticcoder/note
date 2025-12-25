import { useState } from "react";
import "../styles/Posts.css";

export default function ImageCarousel({ images }) {
    const [index, setIndex] = useState(0);
    const total = images.length;

    if (!images || total === 0) return null;

    const prev = (e) => {
        e.stopPropagation();
        setIndex((index - 1 + total) % total);
    };

    const next = (e) => {
        e.stopPropagation();
        setIndex((index + 1) % total);
    };

    return (
        <div className="x-carousel">
            <img
                src={images[index]}
                alt=""
                className="x-carousel-image"
            />

            {total > 1 && (
                <>
                    <button className="x-carousel-btn left" onClick={prev}>
                        ‹
                    </button>
                    <button className="x-carousel-btn right" onClick={next}>
                        ›
                    </button>

                    <div className="x-carousel-dots">
                        {images.map((_, i) => (
                            <span
                                key={i}
                                className={`dot ${i === index ? "active" : ""}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIndex(i);
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
