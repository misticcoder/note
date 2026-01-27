import { useEffect, useState } from "react";
import "./styles/GlobalSearch.css";
import {apiFetch} from "./api";

export default function SearchResultsPage() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    const hash = window.location.hash;
    const queryString = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(queryString);
    const q = params.get("q") || "";

    const [filters, setFilters] = useState({
        events: true,
        clubs: true,
        threads: true,
        posts: true,
    });

    const [sortBy, setSortBy] = useState("relevance");

    useEffect(() => {
        if (!q) {
            setResults(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        apiFetch(`/api/search?q=${encodeURIComponent(q)}`)
            .then(r => r.json())
            .then(data => {
                setResults(data);
                setLoading(false);
            });
    }, [q]);

    if (loading) return <div className="search-page">Searching…</div>;
    if (!results) return <div className="search-page">No search query.</div>;

    return (
        <div className={"page"}>
            <div className={"container"}>
                <div className="search-page">
                    <div className="search-page-title">
                        Search results for “{q}”
                    </div>

                    {/* Filters */}
                    <div className="search-filters">
                        {Object.keys(filters).map(key => (
                            <label key={key} className="search-filter">
                                <input
                                    type="checkbox"
                                    checked={filters[key]}
                                    onChange={() =>
                                        setFilters(prev => ({
                                            ...prev,
                                            [key]: !prev[key],
                                        }))
                                    }
                                />
                                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                            </label>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="search-toolbar">
                        <div className="search-sort">
                            <label>Sort by:</label>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="relevance">Relevance</option>
                                <option value="az">Alphabetical (A–Z)</option>
                                <option value="rating">Rating</option>
                                <option value="participants">Participation</option>
                                <option value="time">Time / Newest</option>
                            </select>
                        </div>
                    </div>

                    {filters.events && (
                        <Section title="Events" items={results.events} sortBy={sortBy}/>
                    )}
                    {filters.clubs && (
                        <Section title="Clubs" items={results.clubs} sortBy={sortBy}/>
                    )}
                    {filters.threads && (
                        <Section title="Threads" items={results.threads} sortBy={sortBy}/>
                    )}
                    {filters.posts && (
                        <Section title="Posts" items={results.posts} sortBy={sortBy}/>
                    )}

                </div>
            </div>
        </div>
    );
}

function Section({title, items, sortBy}) {
    if (!items || items.length === 0) return null;

    const sortedItems = sortItems(items, sortBy, title);

    return (
        <div className="search-section">
            <h3>{title}</h3>

            {sortedItems.map(item => (
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


function sortItems(items, sortBy, section) {
    if (!Array.isArray(items)) return items;
    if (sortBy === "relevance") return items;

    const sorted = [...items];

    switch (section) {
        case "Events":
            if (sortBy === "time") {
                return sorted.sort(
                    (a, b) =>
                        new Date(a.startAt || 0) -
                        new Date(b.startAt || 0)
                );
            }
            if (sortBy === "participants") {
                return sorted.sort(
                    (a, b) => (b.atte ?? 0) - (a.participants ?? 0)
                );
            }
            break;

        case "Clubs":
            if (sortBy === "rating") {
                return sorted.sort(
                    (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
                );
            }
            if (sortBy === "participants") {
                return sorted.sort(
                    (a, b) => (b.members ?? 0) - (a.members ?? 0)
                );
            }
            break;

        case "Threads":
        case "Posts":
            if (sortBy === "newest") {
                return sorted.sort(
                    (a, b) =>
                        new Date(b.createdAt || 0) -
                        new Date(a.createdAt || 0)
                );
            }
            break;
    }

    if (sortBy === "az") {
        return sorted.sort((a, b) =>
            (a.title || "").localeCompare(b.title || "")
        );
    }

    return items;
}

