import { useEffect, useRef, useState } from "react";
import "./styles/GlobalSearch.css";
import {apiFetch} from "./api";

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Fetch default results on focus
    const fetchDefault = () => {
        apiFetch("/api/search")
            .then(r => r.json())
            .then(setResults)
            .catch(() => {});
    };

    // Fetch filtered results
    useEffect(() => {
        if (!open) return;

        if (!query.trim()) {
            fetchDefault();
            return;
        }

        apiFetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(r => r.json())
            .then(setResults)
            .catch(() => {});
    }, [query, open]);

    // Close on outside click
    useEffect(() => {
        const handler = e => {
            if (!containerRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={containerRef} className={"global-search"}>
            <input
                placeholder="Search clubs, events, threads…"
                value={query}
                onFocus={() => {
                    setOpen(true);
                    fetchDefault();
                }}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        window.location.href = `#/search?q=${encodeURIComponent(query)}`;
                        setOpen(false);
                    }}}
                className={"input"}
            />


            {open && results && (
                <SearchDropdown results={results} onClose={() => setOpen(false)} />
            )}
        </div>
    );
}

function SearchDropdown({ results, onClose }) {
    return (
        <div className={"global-search-dropdown"}>
            <SearchSection title="Events" items={results.events} onClose={onClose} />
            <SearchSection title="Clubs" items={results.clubs} onClose={onClose} />
            <SearchSection title="Threads" items={results.threads} onClose={onClose} />
            <SearchSection title="Posts" items={results.posts} onClose={onClose} />
            <SearchSection title="Tags" items={results.tags} onClose={onClose} />
        </div>
    );
}

function SearchSection({ title, items, onClose }) {
    if (!items || items.length === 0) return null;

    return (
        <>
            <div className={"search-section-title"}>
                {title}
            </div>

            {items.map(item => (
                <a
                    key={item.id}
                    href={item.url}
                    className={"search-row"}
                    onClick={onClose}
                >
                    <div>
                        <div className={"search-title"}>{item.title}</div>
                        {item.subtitle && (
                            <div className={"search-subtitle"}>
                                {item.subtitle}
                            </div>
                        )}
                    </div>
                    {item.status && (
                        <div className={`search-status ${item.status}`}>
                            {item.status}
                        </div>
                    )}
                </a>
            ))}
        </>
    );
}