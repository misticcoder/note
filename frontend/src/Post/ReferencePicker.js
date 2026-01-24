import { useEffect, useState } from "react";
import "../styles/Posts.css";
import "../styles/badges.css";
import { getRefBadgeClass } from "../components/referenceBadges";

export default function ReferencePicker({ references, setReferences }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const controller = new AbortController();

        fetch(`/api/posts/references/search?q=${encodeURIComponent(query)}`, {
            signal: controller.signal
        })
            .then(res => res.json())
            .then(data => setResults(data))
            .catch(() => {});

        return () => controller.abort();
    }, [query]);

    const addReference = (ref) => {
        if (
            references.some(
                r => r.type === ref.type && r.targetId === ref.targetId
            )
        ) return;

        setReferences(prev => [...prev, ref]);
        setQuery("");
        setResults([]);
    };

    const removeReference = (idx) => {
        setReferences(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className="reference-picker">
            <input
                className={"reference-textbox"}
                placeholder="Reference"
                value={query}
                onChange={e => setQuery(e.target.value)}
            />

            {results.length > 0 && (
                <div className="reference-results">
                    {results.map((r, i) => (
                        <div
                            key={i}
                            className="reference-result"
                            onClick={() => addReference(r)}
                        >
                            {r.displayText}
                            <span className="type">{r.type}</span>
                        </div>
                    ))}
                </div>
            )}

            {references.map((r, i) => (
                <span
                    key={`${r.type}-${r.targetId}`}
                    className={`badge post-reference ${getRefBadgeClass(r.type)}`}>
                    @{r.displayText}
                    <span
                        className="badge-remove"
                        onClick={() => removeReference(i)}
                    >
                        ×
                    </span>
                </span>
            ))}

        </div>
    );
}
