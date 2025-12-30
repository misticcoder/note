import "../styles/rating.css";

export default function StarRating({
                                       value = 0,
                                       onRate,
                                       disabled = false
                                   }) {
    return (
        <div className={`stars ${disabled ? "disabled" : ""}`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span
                    key={n}
                    className={n <= value ? "star filled" : "star"}
                    onClick={() => !disabled && onRate(n)}
                >
                    ★
                </span>
            ))}
        </div>
    );
}
