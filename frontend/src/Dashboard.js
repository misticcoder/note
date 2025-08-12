import { useEffect, useState } from "react";

function Dashboard() {
    const [threads, setThreads] = useState([]);
    const [news, setNews] = useState([]);
    const [matches, setMatches] = useState([]);
    const [events, setEvents] = useState([]);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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

    const hideThreads = windowWidth < 1000; // breakpoint to hide Threads
    const hideEvents = windowWidth < 800;

    // Extract headNews: Let's take the first news item as headNews if exists
    const headNews = news.length > 0 ? news[0] : null;
    const otherNews = news.length > 1 ? news.slice(1) : [];

    return (
        <main style={styles.Dashboard}>
            <div style={styles.container}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {!hideThreads && (
                        <div style={{ width: '20%' }}>
                            <h3>Threads</h3>
                            {threads.map((thread, idx) => (
                                <div
                                    style={styles.Threads}
                                    key={idx}
                                    onClick={() => alert(`Clicked thread: ${thread.title}`)}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
                                >
                                    {thread.title}
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ width: hideThreads ? (hideEvents ? '70%' : '50%') : '40%' }}>
                        <h3>News</h3>

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
                                <div style={styles.HeadNewsContent}>
                                    <h4 style={{ margin: 0 }}>{headNews.headline}</h4>
                                    {headNews.summary && <p style={{ marginTop: 4 }}>{headNews.summary}</p>}
                                </div>
                            </div>
                        )}

                        {/* Other News */}
                        {otherNews.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => alert(`Clicked news: ${item.headline}`)}
                                style={styles.News}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
                            >
                                {item.headline}
                            </div>
                        ))}
                    </div>

                    <div style={{ width: hideThreads ? (hideEvents ? '30%' : '25%') : '20%' }}>
                        <h3>Matches</h3>
                        {matches.map((match, idx) => (
                            <div
                                key={idx}
                                onClick={() => alert(`Clicked match: ${match.teama} vs ${match.teamb}`)}
                                style={styles.Matches}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
                            >
                                {match.teama} vs {match.teamb} <br />
                                <small>{new Date(match.match_time).toLocaleString()}</small>
                            </div>
                        ))}
                    </div>

                    {!hideEvents && (
                        <div style={{ width: hideThreads ? '25%' : '20%' }}>
                            <h3>Events</h3>
                            {events.map((event, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => alert(`Clicked event: ${event.name}`)}
                                    style={styles.Events}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
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
    border: '1px solid #ccc',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '0px',
    cursor: 'pointer',
    height: '30px', // fixed height for all boxes
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
};

const styles = {
    Dashboard: {
        paddingTop: '40px',
        boxSizing: 'border-box',
        height: '100vh',
        backgroundColor: 'gray',
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        height: '100vh',
        backgroundColor: '#D50032',
    },
    Threads: {
        ...boxBase,
        backgroundColor: '#fff',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    News: {
        ...boxBase,
        backgroundColor: '#f9f9f9',
    },
    Matches: {
        ...boxBase,
        backgroundColor: '#f9f9f9',
    },
    Events: {
        ...boxBase,
        backgroundColor: '#f9f9f9',
    },
    HeadNews: {
        display: 'flex',
        gap: '10px',
        padding: '10px',
        marginBottom: '15px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        borderRadius: '4px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        alignItems: 'flex-start',
        height: '100px',         // fixed height for entire head news box
        overflow: 'hidden',
    },
    HeadNewsImage: {
        width: '120px',
        height: '80px',
        objectFit: 'cover',
        borderRadius: '4px',
        flexShrink: 0,
    },
    HeadNewsContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
};

export default Dashboard;
