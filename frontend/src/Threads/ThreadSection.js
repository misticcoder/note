import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../AuthContext";
import "../styles/Threads.css";
import {timeAgo} from "../components/timeAgo";

export default function ThreadSection({
                                          title = "Threads",
                                          width,
                                          showAddButton = false
                                      }) {
    const { user } = useContext(AuthContext);

    const [threads, setThreads] = useState([]);
    const [hoveredId, setHoveredId] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newThread, setNewThread] = useState({ title: "", content: "" });

    useEffect(() => {
        fetch("/api/threads")
            .then(r => r.json())
            .then(setThreads)
            .catch(() => setThreads([]));
    }, []);

    const boxHover = {
        transform: "translateY(-2px)",
        boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
        backgroundColor: "#cac7c7"
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewThread(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newThread.title.trim() || !newThread.content.trim()) {
            alert("Please fill all fields");
            return;
        }

        try {
            const res = await fetch(
                `/api/threads?requesterEmail=${encodeURIComponent(user.email)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newThread)
                }
            );

            const saved = await res.json();

            if (!res.ok) {
                alert(saved.message || "Failed to create thread");
                return;
            }

            setThreads(prev => [saved, ...prev]);
            setNewThread({ title: "", content: "" });
            setShowModal(false);
        } catch {
            alert("Failed to create thread");
        }
    };

    return (
        <div style={{width, display: "flex", flexDirection: "column"}}>
            {showAddButton && user && (
                <button className="add-btn" onClick={() => setShowModal(true)}>
                    Add Thread
                </button>
            )}

            <h3 className="column-title">Threads</h3>

            {threads.map(thread => (
                <div
                    key={thread.id}
                    className="threads"
                    style={hoveredId === thread.id ? boxHover : {}}
                    onMouseEnter={() => setHoveredId(thread.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => {
                        window.location.hash = `#/threads/${thread.id}`;
                    }}
                >

                    <div style={{display: "flex", flexDirection: "column"}}>
                        <span style={{fontWeight: 400}}>
                            {thread.title}
                        </span>
                        <span className={"x-time"}>
                            {timeAgo(thread.published)}
                            {thread.author && ` by ${thread.author}`}
                        </span>
                    </div>
                </div>
            ))}

            {/* Thread Modal */}
            {showModal && (
                <div className="thread-window">
                    <div className="thread-content">
                        <h3>Add New Thread</h3>

                        <form onSubmit={handleSubmit}>
                            <input
                                name="title"
                                placeholder="Thread Title"
                                value={newThread.title}
                                onChange={handleChange}
                                required
                                className="input"
                            />

                            <textarea
                                name="content"
                                placeholder="Thread Content"
                                value={newThread.content}
                                onChange={handleChange}
                                required
                                className="textarea"
                            />

                            <div style={{display: "flex", gap: 10, justifyContent: "flex-end"}}>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Save Thread
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
