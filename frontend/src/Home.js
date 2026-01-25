import {useEffect, useState, useContext, useMemo} from "react";
import { AuthContext } from "./AuthContext";
import ThreadSection from "./Threads/ThreadSection";
import "./styles/index.css";
import PostFeed from "./Post/PostFeed";
import "./styles/Home.css";
import "./styles/modal.css"


function Home() {
    const [threads, setThreads] = useState([]);
    const [news, setNews] = useState([]);
    const [events, setEvents] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [users, setUsers] = useState([]); // for leader dropdown

    const { user } = useContext(AuthContext);

    // Thread modal state
    const [showThreadModal, setShowThreadModal] = useState(false);
    const [newThread, setNewThread] = useState({ title: "", content: "" });

    // News modal state
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [newNews, setNewNews] = useState({ title: "", content: "" });


    // Club modal state
    const [showClubModal, setShowClubModal] = useState(false);
    const [newClub, setNewClub] = useState({
        logo: null,
        name: "",
        description: "",
        leaderUserId: "",
        category: ""
    });

    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    // Hover state

    useEffect(() => {
        document.title = "Home | InfCom";
        fetch("/api/threads").then(res => res.json()).then(setThreads).catch(() => setThreads([]));
        fetch("/api/news").then(res => res.json()).then(setNews).catch(() => setNews([]));
        fetch("/api/events?status=all")
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data.content)
                        ? data.content
                        : [];
                setEvents(list);
            })
            .catch(() => setEvents([]));

        fetch("/api/clubs").then(res => res.json()).then(data => {
            setClubs(Array.isArray(data) ? data : []);
        }).catch(() => setClubs([]));

        // preload users for leader dropdown (admins only)
        if (isAdmin) {
            fetch("/api/users").then(r => r.json()).then(setUsers).catch(() => setUsers([]));
        }

    }, [isAdmin]);


    // Group clubs by category and sort by member count
    const clubsByCategory = useMemo(() => {
        const map = {};

        clubs.forEach(club => {
            const category = club.category || "OTHER";
            if (!map[category]) map[category] = [];

            map[category].push(club);
        });

        // Sort each category by member count (descending)
        Object.keys(map).forEach(cat => {
            map[cat].sort(
                (a, b) => (b.members?.length || 0) - (a.members?.length || 0)
            );
        });

        return map;
    }, [clubs]);




    // Club modal handlers
    const openClubModal = () => {
        setNewClub({logo:null, name: "", description: "", leaderUserId: "", category: ""});
        setShowClubModal(true);
        // Ensure users list is fresh (in case admin opened later)
        if (isAdmin && users.length === 0) {
            fetch("/api/users").then(r => r.json()).then(setUsers).catch(() => setUsers([]));
        }
    };

    const handleClubChange = (e) => {
        const { name, value } = e.target;
        setNewClub(prev => ({ ...prev, [name]: value }));
    };

    const handleClubSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        if (!newClub.name.trim() || !newClub.description.trim()) {
            alert("Please fill club name and description.");
            return;
        }

        const ClubForm = new FormData();
        ClubForm.append("name", newClub.name);
        ClubForm.append("description", newClub.description);
        ClubForm.append("category", newClub.category);

        if (newClub.logo) {
            ClubForm.append("logo", newClub.logo);
        }

        try {
            const res = await fetch(
                `/api/clubs?requesterEmail=${encodeURIComponent(user.email)}`,
                {
                    method: "POST",
                    body: ClubForm
                }
            );

            const created = await res.json();
            if (!res.ok) {
                alert(created.message || "Failed to create club");
                return;
            }

            if (newClub.leaderUserId) {
                await fetch(
                    `/api/clubs/${created.id}/leader?requesterEmail=${encodeURIComponent(user.email)}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: Number(newClub.leaderUserId) })
                    }
                );
            }

            setClubs(prev => [...prev, created]);
            setShowClubModal(false);
            setNewClub({ logo: null, name: "", description: "", leaderUserId: "", category: "" });

        } catch (err) {
            console.error(err);
            alert("Failed to create club");
        }
    };

    // News modal handlers
    const handleNewsChange = (e) => {
        const { name, value } = e.target;
        setNewNews(prev => ({ ...prev, [name]: value }));
    };

    const handleNewsSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/news?requesterEmail=${encodeURIComponent(user.email)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newNews),
            });

            const savedNews = await res.json();
            if (!res.ok) {
                alert(savedNews.message || "Failed to create News");
                return;
            }
            setNews(prev => [savedNews, ...prev]);
            setNewNews({ title: "", content: "" });
            setShowNewsModal(false);
        } catch (err) {
            console.error("Failed to save news", err);
            alert("Failed to save news");
        }
    };

    const eventsByStatus = useMemo(() => {
        const map = {
            LIVE: [],
            UPCOMING: [],
            ENDED: []
        };

        events.forEach(ev => {
            map[ev.status]?.push(ev);
        });

        return map;
    }, [events]);

    const getEventTimeLabel = (event) => {
        if (event.status === "LIVE") return "LIVE";
        if (event.status === "ENDED") return "Ended";

        if (!event.startAt) return "";

        const now = new Date();
        const start = new Date(event.startAt);
        const diffMs = start - now;

        if (diffMs <= 0) return "Starting";

        const mins = Math.floor(diffMs / 60000);
        const days = Math.floor(mins / 1440);
        const hours = Math.floor((mins % 1440) / 60);
        const minutes = mins % 60;

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const EVENT_STATUSES = [
        { key: "LIVE", label: "Ongoing Events", limit: null },
        { key: "UPCOMING", label: "Upcoming Events", limit: 5 },
        { key: "ENDED", label: "Completed Events", limit: 3 }
    ];

    const EMPTY_MESSAGES = {
        LIVE: "No events happening right now",
        UPCOMING: "No upcoming events scheduled",
        ENDED: "No completed events yet"
    };



    return (
        <main className={"page"}>
            <div className={"container"}>
                <div className={"home-grid"}>
                    {/* Thread */}
                    <aside className={"column threads-column"}>
                        <ThreadSection
                            showAddButton={isAdmin}
                            onAddThread={() => setShowThreadModal(true)}
                        />
                    </aside>

                    {/* Daily News */}
                    <aside className="column news-column">
                        <h3 className={"column-title"}>Feed</h3>
                        <PostFeed/>
                    </aside>

                    {/* Clubs */}
                    <aside className={"column clubs-column"}>
                        {isAdmin && (
                            <button className={"add-btn"} onClick={openClubModal}>
                                Add Club
                            </button>
                        )}

                        {/* Club Modal (ADMIN) */}
                        {showClubModal && (
                            <div className="modal-backdrop">
                                <div className="modal-card">
                                    <h3>Create Club</h3>
                                    <form onSubmit={handleClubSubmit} className={"modal-form"}>
                                        <select
                                            value={newClub.category}
                                            onChange={e => setNewClub(c => ({...c, category: e.target.value}))}
                                            required
                                        >
                                            <option value="">Select category</option>
                                            <option value="SPORTS">Sports</option>
                                            <option value="ACADEMIC">Academic</option>
                                            <option value="SOCIETY">Society</option>
                                            <option value="FAMILY">Family Initiative</option>
                                            <option value="SOCIAL">Social</option>
                                        </select>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setNewClub(prev => ({
                                                ...prev,
                                                logo: e.target.files[0]
                                            }))}
                                        />

                                        <input
                                            name="name"
                                            placeholder="Club Name"
                                            value={newClub.name}
                                            onChange={handleClubChange}
                                            required

                                        />
                                        <textarea
                                            name="description"
                                            placeholder="Description"
                                            value={newClub.description}
                                            onChange={handleClubChange}
                                            required

                                        />
                                        <select
                                            name="leaderUserId"
                                            value={newClub.leaderUserId}
                                            onChange={handleClubChange}

                                        >
                                            <option value="">(Optional) Select Leader</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.username} — {u.email}
                                                </option>
                                            ))}
                                        </select>

                                        <div className={"modal-actions"}>
                                            <button className={"cancelBtn"} type="button"
                                                    onClick={() => setShowClubModal(false)}
                                            > Cancel
                                            </button>

                                            <button type="submit" className={"saveBtn"}>Create</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {clubs.length === 0 && (
                            <div className={"muted"}>No clubs yet.</div>
                        )}

                        {Object.entries(clubsByCategory).map(([category, list]) => (
                            <div key={category}>
                                <h4 className={"column-title"}>
                                    {category}
                                </h4>

                                {list.slice(0, 5).map(club => (
                                    <div
                                        key={club.id}
                                        className={"card"}
                                        onClick={() => {
                                            window.location.hash = `#/clubs/${club.id}`;
                                        }}
                                    >
                                        <div
                                            className={"truncate"}
                                        >
                                            {club.name}
                                        </div>

                                        <span className={"muted"}>
                                            {club.memberCount}
                                        </span>
                                    </div>
                                ))}

                            </div>
                        ))}
                    </aside>


                    {/* Events */}

                    <aside className="column events-column">

                        {isAdmin && (
                            <button
                                className="add-btn"
                                onClick={() => (window.location.hash = "#/events")}
                            >
                                Add Event
                            </button>
                        )}

                        {EVENT_STATUSES.map(({ key, label, limit }) => {
                            const list = eventsByStatus[key] || [];

                            return (
                                <div key={key}>
                                    <h4 className="column-title">{label}</h4>

                                    {list.length === 0 ? (
                                        <div className="muted">{EMPTY_MESSAGES[key]}</div>
                                    ) : (
                                        list
                                            .slice(0, limit ?? list.length)
                                            .map(event => (
                                                <div
                                                    key={event.id}
                                                    className="card event-row"
                                                    onClick={() => {
                                                        window.location.hash = `#/events/${event.id}`;
                                                    }}
                                                >
                                                    <div className="truncate">
                                                        {event.title}
                                                    </div>

                                                    <span className={`event-pill ${event.status.toLowerCase()}`}>
                                                        {getEventTimeLabel(event)}
                                                    </span>
                                                </div>
                                            ))
                                    )}
                                </div>
                            );
                        })}



                    </aside>


                </div>
            </div>


            {/* News Modal */}
            {showNewsModal && (
                <div className={"modal-backdrop"}>
                    <div className={"modal-card"}>
                        <h3>Add New News</h3>
                        <form onSubmit={handleNewsSubmit}>
                            <input
                                name="title"
                                placeholder="News Title"
                                value={newNews.title}
                                onChange={handleNewsChange}
                                required
                            />
                            <textarea
                                name="content"
                                placeholder="News Content"
                                value={newNews.content}
                                onChange={handleNewsChange}
                                required
                            />
                            <button type="submit" className={"add-btn"}>Save News</button>
                            <button type="button" className={"add-btn"} onClick={() => setShowNewsModal(false)} >Cancel</button>
                        </form>
                    </div>
                </div>
            )}

        </main>

    );
}


export default Home;
