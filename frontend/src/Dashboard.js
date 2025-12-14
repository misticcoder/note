import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

function Dashboard() {
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
    // #region agent log
    useEffect(() => {
        fetch('http://127.0.0.1:7242/ingest/eca2c071-a6e9-463e-b837-0f74ac8dbf00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.js:20',message:'Modal state initialized',data:{showThreadModal,showNewsModal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }, [showThreadModal, showNewsModal]);
    // #endregion

    // Club modal state
    const [showClubModal, setShowClubModal] = useState(false);
    const [newClub, setNewClub] = useState({ name: "", description: "", leaderUserId: "" });
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    useEffect(() => {
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
        setNewClub({ name: "", description: "", leaderUserId: "" });
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
        try {
            // 1) Create club
            const createRes = await fetch(`/api/clubs?requesterEmail=${encodeURIComponent(user.email)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newClub.name.trim(), description: newClub.description.trim() })
            });
            const created = await createRes.json().catch(() => ({}));
            if (!createRes.ok) {
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
            setNewClub({ name: "", description: "", leaderUserId: "" });

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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/eca2c071-a6e9-463e-b837-0f74ac8dbf00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.js:192',message:'Resetting newNews',data:{resetValue:{title:"",content:""},expectedValue:{headline:"",body:""},newNewsBefore:newNews},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            setNewNews({ title: "", content: "" });
            setShowNewsModal(false);
        } catch (err) {
            console.error("Failed to save news", err);
            alert("Failed to save news");
        }
    };

    return (
        <main style={styles.Dashboard}>
            <div style={styles.container}>
                <div style={styles.flexRow}>
                    {!hideThreads && (
                        <div style={{ width: threadsWidth }}>
                            <h3>Threads</h3>
                            {isAdmin && (
                                <button style={styles.addBtn} onClick={() => setShowThreadModal(true)}>Add Thread</button>
                            )}
                            {threads.map((thread, idx) => (
                                <div
                                    style={styles.Threads}
                                    key={idx}
                                    onClick={() => { window.location.hash = `#/thread/${thread.id}`; }}
                                >
                                    {thread.title}
                                </div>
                            ))}
                        </div>
                    )}
                    {/* News */}

                    <div style={{ width: newsWidth }}>
                        <h3>News</h3>
                        {isAdmin && (
                            <button style={styles.addBtn} onClick={() => {
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/eca2c071-a6e9-463e-b837-0f74ac8dbf00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.js:226',message:'Add News button clicked',data:{showNewsModalBefore:showNewsModal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                // #endregion
                                setShowNewsModal(true);
                                // #region agent log
                                setTimeout(() => fetch('http://127.0.0.1:7242/ingest/eca2c071-a6e9-463e-b837-0f74ac8dbf00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.js:228',message:'After setShowNewsModel(true)',data:{showNewsModalAfter:showNewsModal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{}), 10);
                                // #endregion
                            }}>Add News</button>
                        )}
                        {headNews && (
                            <div
                                style={styles.HeadNews}
                                onClick={() => {
                                    // #region agent log
                                    fetch('http://127.0.0.1:7242/ingest/eca2c071-a6e9-463e-b837-0f74ac8dbf00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.js:231',message:'Head news clicked',data:{newsId:news?.id,headNewsId:headNews?.id,newsLength:news?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                                    // #endregion
                                    window.location.hash = `#/news/${headNews.id}`;
                                }}
                            >
                                {headNews.imageUrl && <img src={headNews.imageUrl} alt={headNews.title} style={styles.HeadNewsImage} />}
                                <div style={styles.HeadNewsOverlay}>
                                    <h4 style={{ margin: 0 }}>{headNews.title}</h4>
                                </div>
                            </div>
                        )}
                        {otherNews.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    // #region agent log
                                    fetch('http://127.0.0.1:7242/ingest/eca2c071-a6e9-463e-b837-0f74ac8dbf00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.js:242',message:'Other news clicked',data:{itemId:item?.id,newsId:news?.id,newsLength:news?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                                    // #endregion
                                    window.location.hash = `#/news/${item.id}`;
                                }}
                                style={styles.News}
                            >
                                {item.title}
                            </div>
                        ))}
                    </div>

                    {/* Clubs */}


                    <div style={{ width: clubsWidth }}>

                        <h3>Clubs</h3>
                        {isAdmin && (
                            <button style={styles.addBtn} onClick={openClubModal}>Add Club</button>
                        )}

                        {clubs.map((club) => (
                            <div
                                key={club.id}
                                onClick={() => { window.location.hash = `#/clubs/${club.id}`; }}
                                style={styles.Clubs}
                                title={`Open ${club.name}`}
                            >
                                <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {club.name}
                                </div>
                            </div>
                        ))}

                        {clubs.length === 0 && (
                            <div style={{ ...styles.Clubs, justifyContent: "center" }}>No clubs yet.</div>
                        )}
                    </div>

                    {/* Events */}

                    {!hideEvents && (
                        <div style={{ width: eventsWidth }}>
                            <h3>Events</h3>
                            {isAdmin && (
                                <button style={styles.addBtn} onClick={() => { window.location.hash = "#/events"; }}>Add Event</button>
                            )}
                            {events.map((event, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => alert(`Clicked event: ${event.name}`)}
                                    style={styles.Events}
                                >
                                    {event.name} <br />
                                    <small>{new Date(event.event_date_time).toLocaleString()}</small>
                                </div>
                            ))}
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

                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button type="button" onClick={() => setShowClubModal(false)} style={styles.cancelBtn}>Cancel</button>
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
    border: "1px solid #ccc",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "4px",
    cursor: "pointer",
    height: "40px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fff",
    transition: "transform 0.3s ease, box-shadow 0.3s ease, backgroundColor 0.3s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};

const styles = {
    Dashboard: { paddingTop: "60px", height: "100vh", backgroundColor: "gray" },
    container: { maxWidth: "1200px", margin: "0 auto", padding: "0 20px", height: "100%", backgroundColor: "#D50032" },
    flexRow: { display: "flex", gap: "20px", height: "calc(100% - 20px)" },

    Threads: { ...boxBase },
    News: { ...boxBase, backgroundColor: "#f9f9f9" },
    Clubs: { ...boxBase, backgroundColor: "#f9f9f9", justifyContent: "space-between" },
    Events: { ...boxBase, backgroundColor: "#f9f9f9" },

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
};

export default Dashboard;