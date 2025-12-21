import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

function Home() {
    const [threads, setThreads] = useState([]);
    const [news, setNews] = useState([]);
    const [events, setEvents] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [users, setUsers] = useState([]); // for leader dropdown

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const { user } = useContext(AuthContext);

    // Thread modal state
    const [showThreadModal, setShowThreadModal] = useState(false);
    const [newThread, setNewThread] = useState({ title: "", content: "" });

    // News modal state
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [newNews, setNewNews] = useState({ title: "", content: "" });


    // Club modal state
    const [showClubModal, setShowClubModal] = useState(false);
    const [newClub, setNewClub] = useState({logo: null, name: "", description: "", leaderUserId: "" });
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    // Hover state
    const [hoveredId, setHoveredId] = useState(null);


    useEffect(() => {
        document.title = "Home | InfCom";
        fetch("/api/threads").then(res => res.json()).then(setThreads).catch(() => setThreads([]));
        fetch("/api/news").then(res => res.json()).then(setNews).catch(() => setNews([]));
        fetch("/api/events").then(res => res.json()).then(setEvents).catch(() => setEvents([]));
        fetch("/api/clubs").then(res => res.json()).then(data => {
            setClubs(Array.isArray(data) ? data : []);
        }).catch(() => setClubs([]));

        // preload users for leader dropdown (admins only)
        if (isAdmin) {
            fetch("/api/users").then(r => r.json()).then(setUsers).catch(() => setUsers([]));
        }

        function handleResize() { setWindowWidth(window.innerWidth); }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isAdmin]);

    const hideThreads = windowWidth < 1000;
    const hideEvents = windowWidth < 800;

    const newsWidth = hideThreads ? (hideEvents ? "70%" : "50%") : "40%";
    const clubsWidth = hideThreads ? (hideEvents ? "30%" : "25%") : "20%";
    const threadsWidth = "20%";
    const eventsWidth = hideThreads ? "25%" : "20%";

    const headNews = news.length > 0 ? news[0] : null;
    const otherNews = news.length > 1 ? news.slice(1) : [];

    // Thread modal handlers
    const handleThreadChange = (e) => {
        const { name, value } = e.target;
        setNewThread(prev => ({ ...prev, [name]: value }));
    };

    const handleThreadSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/threads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newThread),
            });
            const savedThread = await res.json();
            if (!res.ok) {
                alert(savedThread.message || "Failed to create thread");
                return;
            }
            setThreads(prev => [savedThread, ...prev]);
            setNewThread({ title: "", content: "" });
            setShowThreadModal(false);
        } catch (err) {
            console.error("Failed to save thread", err);
            alert("Failed to save thread");
        }
    };

    // Request to join a club
    const requestJoin = async (clubId, e) => {
        e.stopPropagation(); // prevent navigating when clicking the button
        if (!user) {
            alert("Please log in to request to join.");
            return;
        }
        try {
            const res = await fetch(`/api/clubs/${clubId}/join?requesterEmail=${encodeURIComponent(user.email)}`, {
                method: "POST"
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(body.message || "Failed to send request");
                return;
            }
            alert("Join request sent!");
        } catch (err) {
            alert("Failed to send request");
        }
    };

    // Club modal handlers
    const openClubModal = () => {
        setNewClub({logo:null, name: "", description: "", leaderUserId: "" });
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
        if (!newClub.leaderUserId) {
            if (!window.confirm("No leader selected. Create club without a leader?")) return;
        }
        const form = new FormData();
        form.append("name", newClub.name);
        form.append("description", newClub.description);

        if (newClub.logo) {
            form.append("logo", newClub.logo);
        }

        try {
            // 1) Create club
            const res = await fetch(
                `/api/clubs?requesterEmail=${encodeURIComponent(user.email)}`,
                {
                    method: "POST",
                    body: form
                }
            );
            const created = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(created.message || "Failed to create club");
                return;
            }

            // 2) Optionally assign leader
            if (newClub.leaderUserId) {
                const assignRes = await fetch(`/api/clubs/${created.id}/leader?requesterEmail=${encodeURIComponent(user.email)}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: Number(newClub.leaderUserId) })
                });
                const assignBody = await assignRes.json().catch(() => ({}));
                if (!assignRes.ok) {
                    alert(assignBody.message || "Club created, but assigning leader failed");
                    // We still proceed to add the club to UI
                }
            }

            // 3) Update UI and close
            setClubs(prev => [...prev, created]);
            setShowClubModal(false);
            setNewClub({ logo: null, name: "", description: "", leaderUserId: "" });

            // 4) (Optional) Navigate to club page
            // window.location.hash = `#/clubs/${created.id}`;
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
            const res = await fetch("/api/news", {
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

    const boxHover = {
        transform: "translateY(-2px)",
        boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
        backgroundColor: "#cac7c7"
    };

    const now = new Date();

    const classifiedEvents = events.map(ev => {
        const start = ev.startAt ? new Date(ev.startAt) : null;
        const end = ev.endAt ? new Date(ev.endAt) : null;

        const fallbackEnd = start
            ? new Date(start.getTime() + 2 * 60 * 60 * 1000)
            : null;

        const effectiveEnd = end || fallbackEnd;

        let status = "UPCOMING";
        if (start && now >= start && effectiveEnd && now <= effectiveEnd) {
            status = "LIVE";
        } else if (effectiveEnd && now > effectiveEnd) {
            status = "ENDED";
        }

        return { ...ev, _status: status };
    });

    const ongoingEvents = classifiedEvents.filter(e => e._status === "LIVE");
    const upcomingEvents = classifiedEvents.filter(e => e._status === "UPCOMING");
    const completedEvents = classifiedEvents.filter(e => e._status === "ENDED");

    const renderEventRow = (event) => {
        const now = new Date();
        let label = "";

        if (event._status === "LIVE") {
            label = "LIVE";
        } else if (event._status === "ENDED") {
            label = "Ended";
        } else if (event.startAt) {
            const diff = new Date(event.startAt) - now;
            const mins = Math.max(0, Math.floor(diff / 60000));
            const d = Math.floor(mins / 1440);
            const h = Math.floor((mins % 1440) / 60);
            const m = mins % 60;

            label = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
        }

        return (
            <div
                key={event.id}
                style={{
                    ...styles.Events,
                    ...(hoveredId === `event-${event.id}` ? boxHover : {})
                }}
                onMouseEnter={() => setHoveredId(`event-${event.id}`)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => (window.location.hash = `#/events/${event.id}`)}
            >
                <div style={styles.eventTitle}>{event.title}</div>
                <div
                    style={{
                        ...styles.eventTime,
                        ...(event._status === "LIVE"
                            ? styles.livePill
                            : event._status === "ENDED"
                                ? styles.endedText
                                : {})
                    }}
                >
                    {label}
                </div>
            </div>
        );
    };




    return (
        <main style={styles.Dashboard}>
            <div style={styles.container}>
                <div style={styles.flexRow}>
                    {/* Thread */}
                    {!hideThreads && (
                        <div style={{width: threadsWidth, display: "flex", flexDirection: "column"}}>

                            <h3 style={styles.col_title}>Threads</h3>
                            {isAdmin && (
                                <button style={styles.addBtn} onClick={() => setShowThreadModal(true)}>Add
                                    Thread</button>
                            )}
                            <div >
                                {threads.map((thread, idx) => (
                                    <div
                                        key={thread.id}
                                        style={{
                                            ...styles.Threads,
                                            ...(hoveredId === `thread-${thread.id}` ? boxHover : {})
                                        }}
                                        onMouseEnter={() => setHoveredId(`thread-${thread.id}`)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        onClick={() => {
                                            window.location.hash = `#/thread/${thread.id}`;
                                        }}
                                    >
                                        {thread.title}
                                    </div>
                                ))}
                            </div>

                        </div>
                    )}
                    {/* Daily News */}

                    <div style={{width: newsWidth, display: "flex", flexDirection: "column"}}>
                        <h3 style={styles.col_title}>Daily News</h3>
                        {isAdmin && (
                            <button style={styles.addBtn} onClick={() => setShowNewsModal(true)}>Add News</button>
                        )}
                        {news.map((news, idx) => (
                            <div
                                key={news.id}
                                style={{
                                    ...styles.News,
                                    ...(hoveredId === `news-${news.id}` ? boxHover : {})
                                }}
                                onMouseEnter={() => setHoveredId(`news-${news.id}`)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => {
                                    window.location.hash = `#/news/${news.id}`;
                                }}
                            >
                                {news.title}
                            </div>
                        ))}
                    </div>

                    {/* Clubs */}


                    <div style={{width: clubsWidth, display: "flex", flexDirection: "column"}}>

                        <h3 style={styles.col_title}>Clubs</h3>
                        {isAdmin && (
                            <button style={styles.addBtn} onClick={openClubModal}>Add Club</button>
                        )}

                        {clubs.map((club) => (
                            <div
                                key={club.id}
                                style={{
                                    ...styles.Clubs,
                                    ...(hoveredId === `club-${club.id}` ? boxHover : {})
                                }}
                                onMouseEnter={() => setHoveredId(`club-${club.id}`)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => {
                                    window.location.hash = `#/clubs/${club.id}`;
                                }}
                            >

                                <div style={{
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                }}>
                                    {club.name}
                                </div>
                            </div>
                        ))}

                        {clubs.length === 0 && (
                            <div style={{...styles.Clubs, justifyContent: "center"}}>No clubs yet.</div>
                        )}
                    </div>

                    {/* Events */}

                    {!hideEvents && (
                        <div style={{ width: eventsWidth, display: "flex", flexDirection: "column" }}>
                            <h3 style={styles.col_title}>ONGOING Events</h3>

                            {isAdmin && (
                                <button style={styles.addBtn} onClick={() => {
                                    window.location.hash = "#/events";
                                }}>Add Event</button>
                            )}

                            <div>

                                {ongoingEvents.length > 0 ? (
                                    ongoingEvents.map(renderEventRow)
                                ) : (
                                    <div style={styles.emptyText}>No ongoing events</div>
                                )}

                            </div>

                            <div>
                                <h3 style={styles.col_title}>UPCOMING Events</h3>
                                {upcomingEvents.length > 0 && (
                                    <>
                                        {upcomingEvents.slice(0, 5).map(renderEventRow)}
                                    </>
                                )}
                            </div>

                            <div>
                                <h3 style={styles.col_title}>COMPLETED Events</h3>
                                {completedEvents.length > 0 && (
                                    <>
                                        {completedEvents.slice(0, 3).map(renderEventRow)}
                                    </>
                                )}
                            </div>

                        </div>
                    )}


                </div>
            </div>

            {/* Thread Modal */}
            {showThreadModal && (
                <div style={styles.ThreadWindow}>
                    <div style={styles.ThreadContent}>
                        <h3>Add New Thread</h3>
                        <form onSubmit={handleThreadSubmit}>
                            <input
                                name="title"
                                placeholder="Thread Title"
                                value={newThread.title}
                                onChange={handleThreadChange}
                                required
                                style={styles.input}
                            />
                            <textarea
                                name="content"
                                placeholder="Thread Content"
                                value={newThread.content}
                                onChange={handleThreadChange}
                                required
                                style={styles.textarea}
                            />
                            <button type="submit" style={styles.submitBtn}>Save Thread</button>
                            <button type="button" onClick={() => setShowThreadModal(false)} style={styles.cancelBtn}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {/* News Modal */}
            {showNewsModal && (
                <div style={styles.ThreadWindow}>
                    <div style={styles.ThreadContent}>
                        <h3>Add New News</h3>
                        <form onSubmit={handleNewsSubmit}>
                            <input
                                name="title"
                                placeholder="News Title"
                                value={newNews.title}
                                onChange={handleNewsChange}
                                required
                                style={styles.input}
                            />
                            <textarea
                                name="content"
                                placeholder="News Content"
                                value={newNews.content}
                                onChange={handleNewsChange}
                                required
                                style={styles.textarea}
                            />
                            <button type="submit" style={styles.submitBtn}>Save News</button>
                            <button type="button" onClick={() => setShowNewsModal(false)} style={styles.cancelBtn}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Club Modal (ADMIN) */}
            {showClubModal && (
                <div style={styles.ThreadWindow}>
                    <div style={styles.ThreadContent}>
                        <h3>Create Club</h3>
                        <form onSubmit={handleClubSubmit}>
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
                                style={styles.input}
                            />
                            <textarea
                                name="description"
                                placeholder="Description"
                                value={newClub.description}
                                onChange={handleClubChange}
                                required
                                style={styles.textarea}
                            />
                            <select
                                name="leaderUserId"
                                value={newClub.leaderUserId}
                                onChange={handleClubChange}
                                style={styles.input}
                            >
                                <option value="">(Optional) Select Leader</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.username} — {u.email}
                                    </option>
                                ))}
                            </select>

                            <div style={{display: "flex", gap: 10, justifyContent: "flex-end"}}>
                                <button type="button" onClick={() => setShowClubModal(false)}
                                        style={styles.cancelBtn}>Cancel
                                </button>
                                <button type="submit" style={styles.submitBtn}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </main>
    );
}

const boxBase = {
    borderTop: "1px solid #cacaca",
    boxShadow: "0 5px 5px rgba(0,0,0,0.1)",
    padding: "12px 12px",
    cursor: "pointer",
    minHeight: "37px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#605f5f",
    transition: "transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
};



const styles = {
    Dashboard: {
        minHeight: "100vh",
        backgroundColor: "#2f2f2f",
        display: "flex",
        justifyContent: "center"
    },

    container: {
        width: "100%",
        maxWidth: "1200px",
        padding: "60px 24px 24px",
        boxSizing: "border-box",
        backgroundColor:"#4a4a4a"
    },
    flexRow: {
        display: "flex",
        gap: "24px",
        alignItems: "flex-start",
        justifyContent: "center",
        width: "100%"
    },


    Threads: { ...boxBase, color:"#FFFFE3"},
    News: { ...boxBase, color:"#FFFFE3"},
    Clubs: { ...boxBase, color:"#FFFFE3"},
    Events: { ...boxBase,color:"#FFFFE3"},

    HeadNews: { position: "relative", width: "100%", height: "150px", marginBottom: "15px", borderRadius: "6px", overflow: "hidden", boxShadow: "0 4px 10px rgba(0,0,0,0.2)", cursor: "pointer" },
    HeadNewsImage: { width: "100%", height: "100%", objectFit: "cover" },
    HeadNewsOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "8px 10px", fontSize: "1rem" },

    addBtn: { margin: "10px 0px", padding: "5px 8px", fontSize: "0.8rem", borderRadius: "4px", backgroundColor: "#041E42", color: "#D50032", border: "1px solid #D50032", cursor: "pointer", fontWeight: "Bold", textDecoration: "none", display: "inline-block" },
    smallBtn: { padding: "4px 8px", fontSize: "0.75rem", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" },

    ThreadWindow: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    ThreadContent: { backgroundColor: "#fff", padding: "20px", borderRadius: "6px", width: "420px", maxWidth: "90%" },

    input: { width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" },
    textarea: { width: "100%", padding: "8px", minHeight: "80px", borderRadius: "4px", border: "1px solid #ccc", marginBottom: "10px", resize: "vertical" },

    submitBtn: { padding: "8px 12px", backgroundColor: "#D50032", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
    cancelBtn: { padding: "8px 12px", backgroundColor: "#ccc", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer" },

    col_title:{ textTransform: "uppercase",
        fontWeight: 700,
        fontSize: "15px",
        color: "#FFFFE3",
        paddingLeft: "10px",
        paddingRight: "15px",
        display: "inline-block"},

    eventRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 10px",
        minHeight: 40,
        borderTop: "1px solid #555",
        cursor: "pointer"
    },
    eventTitle: {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        color: "#FFFFE3"
    },
    eventTime: {
        flexShrink: 0,
        fontWeight: 600
    },
    livePill: {
        background: "#d50032",
        color: "#fff",
        padding: "2px 8px",
        borderRadius: 999
    },
    endedText: {
        color: "#9aa0a6"
    },
    emptyText: {
        ...boxBase,
        padding: "8px 12px",
        color: "#9aa0a6",
        fontSize: "13px",
        fontStyle: "italic"}
};

export default Home;
