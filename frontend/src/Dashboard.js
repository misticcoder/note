import {useContext, useEffect, useState} from "react";
import {AuthContext} from "./AuthContext";
import { useNavigate } from "react-router-dom";


function Dashboard() {
    const [threads, setThreads] = useState([]);
    const [news, setNews] = useState([]);
    const [matches, setMatches] = useState([]);
    const [events, setEvents] = useState([]);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetch("/api/threads").then(res => res.json()).then(setThreads);
        fetch("/api/news").then(res => res.json()).then(setNews);
        fetch("/api/matches").then(res => res.json()).then(data => {
            if (Array.isArray(data)) {
                setMatches(data);
            } else if (data.content) {
                setMatches(data.content);
            } else {
                setMatches([]);
            }
        }).catch(() => setMatches([]));
        fetch("/api/events").then(res => res.json()).then(setEvents);

        function handleResize() {
            setWindowWidth(window.innerWidth);
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const hideThreads = windowWidth < 1000; // Hide threads if width < 1000px
    const hideEvents = windowWidth < 800;  // Hide events if width < 800px

    // Width adjustments
    const newsWidth = hideThreads ? (hideEvents ? "70%" : "50%") : "40%";
    const matchesWidth = hideThreads ? (hideEvents ? "30%" : "25%") : "20%";
    const threadsWidth = "20%";
    const eventsWidth = hideThreads ? "25%" : "20%";

    // Head News logic
    const headNews = news.length > 0 ? news[0] : null;
    const otherNews = news.length > 1 ? news.slice(1) : [];

    const handleAdd = (type) => alert('New $(type)');

    return (
        <main style={styles.Dashboard}>
            <div style={styles.container}>
                <div style={styles.flexRow}>
                    {!hideThreads && (
                        <div style={{ width: threadsWidth }}>
                            <h3>Threads</h3>
                            {user?.role === "admin" && (
                                <button style={styles.addBtn} onClick={() => handleAdd("Thread")}>Add Thread</button>
                            )}
                            {threads.map((thread, idx) => (
                                <div
                                    style={styles.Threads}
                                    key={idx}
                                    onClick={() => navigate(`/thread/&{idx}`)}
                                >
                                    {thread.title}
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ width: newsWidth }}>
                        <h3>News</h3>
                        {user?.role === "admin" && (
                            <button style={styles.addBtn} onClick={() => handleAdd("News")}>Add News</button>
                        )}

                        {/* Head News */}
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

                        {/* Other News */}
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
                        {user?.role === "admin" && (
                            <button style={styles.addBtn} onClick={() => handleAdd("Matches")}>Add Matches</button>
                        )}
                        {matches.map((match, idx) => (
                            <div
                                key={idx}
                                onClick={() => alert(`Clicked match: ${match.teama} vs ${match.teamb}`)}
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
                            {user?.role === "admin" && (
                                <button style={styles.addBtn} onClick={() => handleAdd("Event")}>Add Event</button>
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
    transition: "transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};
const styles = {
    Dashboard: {
        paddingTop: "60px",
        height: "100vh",
        backgroundColor: "gray",
    },
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 20px",
        height: "100%",
        backgroundColor: "#D50032",
    },
    flexRow: {
        display: "flex",
        gap: "20px",
        height: "calc(100% - 20px)",
    },
    Threads: {
        ...boxBase,
    },
    News: {
        ...boxBase,
        backgroundColor: "#f9f9f9",
    },
    Matches: {
        ...boxBase,
        backgroundColor: "#f9f9f9",
    },
    Events: {
        ...boxBase,
        backgroundColor: "#f9f9f9",
    },
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
    HeadNewsImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
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
    addBtn:{
        margin: "10px 0px",
        padding: "5px 10px",
        fontSize: "0.8rem",
        borderRadius: "4px",
        backgroundColor: "#041E42",
        color: "#D50032",
        border: "1px solid #D50032",
        cursor: "pointer",
        fontfamily: "garamond"
    },
};

export default Dashboard;
