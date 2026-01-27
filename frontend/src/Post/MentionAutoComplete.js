import { useEffect, useState } from "react";

import { apiFetch } from "../api";

export default function MentionAutocomplete({
                                                value,
                                                cursorPos,
                                                onInsert,
                                                onClose,
                                            }) {
    const [query, setQuery] = useState(null);
    const [results, setResults] = useState([]);

    /* ===================== DETECT QUERY ===================== */

    useEffect(() => {
        if (cursorPos == null) return;

        const textUpToCursor = value.slice(0, cursorPos);
        const match = textUpToCursor.match(/@(\w{1,20})$/);

        if (match) {
            setQuery(match[1]);
        } else {
            setQuery(null);
            setResults([]);
        }
    }, [value, cursorPos]);

    /* ===================== FETCH RESULTS ===================== */

    useEffect(() => {
        if (!query) return;

        const controller = new AbortController();

        apiFetch(
            `/api/posts/references/search?q=${encodeURIComponent(query)}`,
            { signal: controller.signal }
        )
            .then(r => r.json())
            .then(setResults)
            .catch(() => {});

        return () => controller.abort();
    }, [query]);

    if (!query || results.length === 0) return null;

    /* ===================== RENDER ===================== */

    return (
        <div className="mention-dropdown">
            {results.map(item => (
                <button
                    key={`${item.type}-${item.id}`}
                    className="mention-item"
                    onClick={() => {
                        onInsert(item);
                        onClose();
                    }}
                >
                    <span>@{item.displayText}</span>
                    <span className="mention-type">{item.type}</span>
                </button>
            ))}
        </div>
    );
}
