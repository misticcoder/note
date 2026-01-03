import { useEffect, useState } from "react";
import "./styles/GlobalSearch.css";

export default function SearchResultsPage() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    const hash = window.location.hash;
    const queryString = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(queryString);
    const q = params.get("q") || "";

    useEffect(() => {
        if (!q) {
            setResults(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        fetch(`/api/search?q=${encodeURIComponent(q)}`)
            .then(r => r.json())
            .then(data => {
                setResults(data);
                setLoading(false);
            });
    }, [q]);

    if (loading) {
        return <div className="search-page">Searching…</div>;
    }

    if (!results) {
        return <div className="search-page">No search query.</div>;
    }

    return (
        <div className="search-page">
            <div className="search-page-title">
                Search results for “{q}”
            </div>

            <Section title="Events" items={results.events} />
            <Section title="Clubs" items={results.clubs} />
            <Section title="Threads" items={results.threads} />
            <Section title="Posts" items={results.posts} />
        </div>
    );
}

function Section({ title, items }) {
    if (!items || items.length === 0) return null;

    return (
        <div className="search-section">
            <h3>{title}</h3>

            {items.map(item => (
                <a key={item.id} href={item.url} className="search-card">
                    <div className="search-card-title">
                        {item.title}
                    </div>

                    {item.subtitle && (
                        <div className="search-card-subtitle">
                            {item.subtitle}
                        </div>
                    )}
                </a>
            ))}
        </div>
    );
}
