import { useState, useMemo } from "react";
import "../styles/events.css";
import Dropdown from "../components/Dropdown";
import "../styles/badges.css";

export default function EventTable({
                                       events = [],
                                       loading = false,
                                       error = "",
                                       showClub = true,
                                       isPrivileged = false,
                                       onEdit,
                                       onDelete
                                   }) {

    const [selectedTag, setSelectedTag] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllTags, setShowAllTags] = useState(false);

    if (loading) return <p className="muted">Loading…</p>;
    if (error) return <p className="error">{error}</p>;

    if (!events.length) {
        return (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>
                No events to display.
            </div>
        );
    }

    // Get all unique tags from events
    const allTags = useMemo(() => {
        const tagSet = new Set();
        events.forEach(ev => {
            ev.tags?.forEach(t => {
                const label = typeof t === "string" ? t : t.name;
                tagSet.add(label);
            });
        });
        return Array.from(tagSet).sort();
    }, [events]);

    // Filter tags based on search query
    const filteredTags = useMemo(() => {
        if (!searchQuery.trim()) return allTags;
        const query = searchQuery.toLowerCase();
        return allTags.filter(tag => tag.toLowerCase().includes(query));
    }, [allTags, searchQuery]);

    // Filter events based on selected tag
    const filteredEvents = useMemo(() => {
        if (!selectedTag) return events;

        return events.filter(ev => {
            return ev.tags?.some(t => {
                const label = typeof t === "string" ? t : t.name;
                return label === selectedTag;
            });
        });
    }, [events, selectedTag]);

    const handleTagSelect = (tag) => {
        setSelectedTag(tag);
        setSearchQuery('');
    };

    return (
        <div className="events-table-container">
            {/* COMPACT TAG FILTER */}
            {allTags.length > 0 && (
                <div className="compact-tag-filter">
                    <div className="compact-tag-filter-header">
                        <input
                            type="text"
                            placeholder="🔍 Quick tag filter..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="compact-tag-search-input"
                        />
                        {selectedTag && (
                            <button
                                onClick={() => {
                                    setSelectedTag(null);
                                    setSearchQuery('');
                                }}
                                className="compact-clear-btn"
                            >
                                Clear ✕
                            </button>
                        )}
                        <button
                            onClick={() => setShowAllTags(!showAllTags)}
                            className="compact-toggle-btn"
                        >
                            {showAllTags ? '▲ Hide' : '▼ Show all'}
                        </button>
                    </div>

                    {selectedTag && (
                        <div className="compact-filter-status">
                            Filtered: {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} with <strong>{selectedTag}</strong>
                        </div>
                    )}

                    {(showAllTags || searchQuery.trim()) && (
                        <div className="compact-tags-container">
                            {filteredTags.length > 0 ? (
                                filteredTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagSelect(tag)}
                                        className={`compact-tag-chip ${selectedTag === tag ? 'active' : ''}`}
                                    >
                                        {tag}
                                    </button>
                                ))
                            ) : (
                                <span className="compact-no-tags">
                                    No tags found matching "{searchQuery}"
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* EVENTS TABLE */}
            <div className="events-table">
                <div className={`events-header ${isPrivileged ? "has-actions" : ""}`}>
                    <div>#</div>
                    <div>Event</div>
                    {showClub && <div className="club-col">Club</div>}
                    <div>Status</div>
                    <div>Avg. Rating</div>
                    {isPrivileged && <div>Visibility</div>}
                    {isPrivileged && <div className="actions-col">Actions</div>}
                </div>

                {filteredEvents.length === 0 && selectedTag ? (
                    <div className="muted" style={{ padding: 20, textAlign: "center" }}>
                        No events found with tag "{selectedTag}".
                    </div>
                ) : (
                    filteredEvents.map((ev, i) => {
                        const status = ev.status;

                        return (
                            <div
                                key={ev.id}
                                className={`events-row clickable ${
                                    isPrivileged ? "has-actions" : ""
                                }`}
                                onClick={() =>
                                    (window.location.hash = `#/events/${ev.id}`)
                                }
                            >
                                <div className="rank">{i + 1}</div>

                                <div className="event-main">
                                    <div
                                        className="event-title"
                                        style={{display: "flex", alignItems: "center", gap: 8}}
                                    >
                                        <span>{ev.title}</span>

                                        {ev.category === "EXTERNAL" && ev.externalUrl && (
                                            <a
                                                href={ev.externalUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="external-link-btn"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Open link
                                            </a>
                                        )}
                                    </div>

                                    <div className="event-meta">
                                        {ev.startAt
                                            ? new Date(ev.startAt).toLocaleString()
                                            : "TBA"}
                                        {ev.location && ` · ${ev.location}`}
                                        {ev.author?.name && ` · by ${ev.author.name}`}
                                    </div>

                                    {ev.tags && ev.tags.length > 0 && (
                                        <div className="event-tags-inline">
                                            {ev.tags.map((t) => {
                                                const label = typeof t === "string" ? t : t.name;
                                                const isSelected = selectedTag === label;
                                                return (
                                                    <span
                                                        key={label}
                                                        className={`event-tag clickable ${isSelected ? 'tag-selected' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTag(label);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        {label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {showClub && (
                                    <div>
                                        {ev.clubId ? (
                                            <span
                                                className="event-club-badge"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.hash = `#/clubs/${ev.clubId}`;
                                                }}
                                            >
                                                {ev.clubName}
                                            </span>
                                        ) : (
                                            <span className="muted">Independent</span>
                                        )}
                                    </div>
                                )}

                                <div className={`event-status ${status.toLowerCase()}`}>
                                    {status}
                                </div>

                                <div className="event-rating-inline">
                                    {ev.ratingCount > 0 ? (
                                        <>
                                            <span className="star">★</span>
                                            {ev.averageRating.toFixed(1)}
                                            <span className="rating-count">
                                                ({ev.ratingCount})
                                            </span>
                                        </>
                                    ) : (
                                        <span className="muted">No ratings</span>
                                    )}
                                </div>

                                {isPrivileged && (
                                    <div>
                                        <span
                                            className={`visibility-badge ${
                                                ev.visibility === "PUBLIC" ? "public" : "restricted"
                                            }`}
                                        >
                                            {ev.visibility === "PUBLIC" ? "Public" : "Club Members"}
                                        </span>
                                    </div>
                                )}

                                {isPrivileged && (
                                    <div className="actions">
                                        <Dropdown
                                            onEdit={() => onEdit(ev)}
                                            onDelete={() => onDelete(ev)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}