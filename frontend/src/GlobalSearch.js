import { useEffect, useRef, useState } from "react";
import "./styles/GlobalSearch.css";

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Fetch default results on focus
    const fetchDefault = () => {
        fetch("/api/search")
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

        fetch(`/api/search?q=${encodeURIComponent(query)}`)
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
                className={"input"}
            />


            {open && results && (
                <SearchDropdown results={results} />
            )}
        </div>
    );
}

function SearchDropdown({ results }) {
    return (
        <div className={"global-search-dropdown"}>
            <SearchSection title="Events" items={results.events} />
            <SearchSection title="Clubs" items={results.clubs} />
            <SearchSection title="Threads" items={results.threads} />
            <SearchSection title="Posts" items={results.posts} />
        </div>
    );
}

function SearchSection({ title, items }) {
    if (!items || items.length === 0) return null;

    return (
        <>
            <div className={"search-title"}>
                {title}
            </div>

            {items.map(item => (
                <a
                    key={item.id}
                    href={item.url}
                    className={"search-row"}
                >
                    <div>{item.title}</div>
                    {item.subtitle && (
                        <div className={"search-subtitle"}>
                            {item.subtitle}
                        </div>
                    )}
                </a>
            ))}
        </>
    );
}
