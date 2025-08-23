import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

function Dashboard() {
    const [threads, setThreads] = useState([]);
    const [news, setNews] = useState([]);
    const [matches, setMatches] = useState([]);
    const [events, setEvents] = useState([]);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const { user } = useContext(AuthContext);

    // Normalize role check (handles "ADMIN", "admin", etc.)
    const isAdmin = !!user && String(user.role).toUpperCase() === "ADMIN";

    // Modal state (typo fix: setShowThreadModal)
    const [showThreadModal, setShowThreadModal] = useState(false);
    const [newThread, setNewThread] = useState({ title: "", content: "" });

    useEffect(() => {
        fetch("/api/threads").then(res => res.json()).then(setThreads);
        fetch("/api/news").then(res => res.json()).then(setNews);
        fetch("/api/matches")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMatches(data);
                else if (data.content) setMatches(data.content);
                else setMatches([]);
            })
            .catch(() => setMatches([]));
        fetch("/api/events").then(res => res.json()).then(setEvents);

        function handleResize() {
            setWindowWidth(window.innerWidth);
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const hideThreads = windowWidth < 1000;
    const hideEvents = windowWidth < 800;

    const newsWidth = hideThreads ? (hideEvents ? "70%" : "50%") : "40%";
    const matchesWidth = hideThreads ? (hideEvents ? "30%" : "25%") : "20%";
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
            if (!res.ok) throw new Error("Failed to save thread");
            const savedThread = await res.json();
            setThreads(prev => [savedThread, ...prev]); // add to dashboard
            setNewThread({ title: "", content: "" });
            setShowThreadModal(false);
        } catch (err) {
            console.error("Failed to save thread", err);
            alert("Failed to save thread");
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
                                <button
                                    style={styles.addBtn}
                                    onClick={() => setShowThreadModal(true)}
                                >
                                    Add Thread
                                </button>
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

                    <div style={{ width: newsWidth }}>
                        <h3>News</h3>
                        {isAdmin && (
                            <button
                                style={styles.addBtn}
                                onClick={() => alert("Open Add News modal")}
                            >
                                Add News
                            </button>
                        )}
                        {headNews && (
                            <div
                                style={styles.HeadNews}
                                onClick={() => alert(`Clicked head news: ${headNews.headline}`)}
                            >
                                {headNews.imageUrl && (
                                    <img
                                        src={headNews.imageUrl}
                                        alt={headNews.headline}
                                        style={styles.HeadNewsImage}
                                    />
                                )}
                                <div style={styles.HeadNewsOverlay}>
                                    <h4 style={{ margin: 0 }}>{headNews.headline}</h4>
                                </div>
                            </div>
                        )}
                        {otherNews.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => alert(`Clicked news: ${item.headline}`)}
                                style={styles.News}
                            >
                                {item.headline}
                            </div>
                        ))}
                    </div>

                    <div style={{ width: matchesWidth }}>
                        <h3>Matches</h3>
                        {isAdmin && (
                            <button
                                style={styles.addBtn}
                                onClick={() => alert("Open Add Match modal")}
                            >
                                Add Match
                            </button>
                        )}
                        {matches.map((match, idx) => (
                            <div
                                key={idx}
                                onClick={() =>
                                    alert(`Clicked match: ${match.teama} vs ${match.teamb}`)
                                }
                                style={styles.Matches}
                            >
                                {match.teama} vs {match.teamb} <br />
                                <small>{new Date(match.match_time).toLocaleString()}</small>
                            </div>
                        ))}
                    </div>

                    {!hideEvents && (
                        <div style={{ width: eventsWidth }}>
                            <h3>Events</h3>
                            {isAdmin && (
                                <button
                                    style={styles.addBtn}
                                    onClick={() => alert("Open Add Event modal")}
                                >
                                    Add Event
                                </button>
                            )}
                            {events.map((event, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => alert(`Clicked event: ${event.name}`)}
                                    style={styles.Events}
                                >
                                    {event.name} <br />
                                    <small>
                                        {new Date(event.event_date_time).toLocaleString()}
                                    </small>
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
                            <button type="submit" style={styles.submitBtn}>
                                Save Thread
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowThreadModal(false)}
                                style={styles.cancelBtn}
                            >
                                Cancel
                            </button>
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
    transition:
        "transform 0.3s ease, box-shadow 0.3s ease, backgroundColor 0.3s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};

const styles = {
    Dashboard: { paddingTop: "60px", height: "100vh", backgroundColor: "gray" },
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 20px",
        height: "100%",
        backgroundColor: "#D50032",
    },
    flexRow: { display: "flex", gap: "20px", height: "calc(100% - 20px)" },
    Threads: { ...boxBase },
    News: { ...boxBase, backgroundColor: "#f9f9f9" },
    Matches: { ...boxBase, backgroundColor: "#f9f9f9" },
    Events: { ...boxBase, backgroundColor: "#f9f9f9" },
    HeadNews: {
        position: "relative",
        width: "100%",
        height: "150px",
        marginBottom: "15px",
        borderRadius: "6px",
        overflow: "hidden",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        cursor: "pointer",
    },
    HeadNewsImage: { width: "100%", height: "100%", objectFit: "cover" },
    HeadNewsOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        padding: "8px 10px",
        fontSize: "1rem",
    },
    addBtn: {
        margin: "10px 0px",
        padding: "5px 8px",
        fontSize: "0.8rem",
        borderRadius: "4px",
        backgroundColor: "#041E42",
        color: "#D50032",
        border: "1px solid #D50032",
        cursor: "pointer",
        fontWeight: "Bold",
    },
    ThreadWindow: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    ThreadContent: {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "6px",
        width: "400px",
        maxWidth: "90%",
    },
    input: {
        width: "100%",
        padding: "8px",
        marginBottom: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
    },
    textarea: {
        width: "100%",
        padding: "8px",
        height: "100px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        marginBottom: "10px",
    },
    submitBtn: {
        padding: "8px 12px",
        marginRight: "10px",
        backgroundColor: "#D50032",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    cancelBtn: {
        padding: "8px 12px",
        backgroundColor: "#ccc",
        color: "#000",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
};

export default Dashboard;
