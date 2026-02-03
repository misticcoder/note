import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../AuthContext";
import "../styles/Threads.css";
import {timeAgo} from "../components/timeAgo";
import "../styles/modal.css"
import {apiFetch} from "../api";

export default function ThreadSection({
                                          title = "Threads",
                                          width,
                                          showAddButton = false
                                      }) {
    const { user } = useContext(AuthContext);

    const [threads, setThreads] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newThread, setNewThread] = useState({ title: "", content: "" });

    useEffect(() => {
        apiFetch("/api/threads")
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data.content)
                        ? data.content
                        : [];

                setThreads(list);
            })
            .catch(() => setThreads([]));
    }, []);

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
            const res = await apiFetch(
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
            {threads.map(thread => (
                <div
                    key={thread.id}
                    className="card"
                    onClick={() => {
                        window.location.hash = `#/threads/${thread.id}`;
                    }}
                >
                    <div style={{display: "flex", flexDirection: "column"}}>
                        <span style={{color:"black", fontWeight: 600}}>
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
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h3>Add New Thread</h3>

                        <form onSubmit={handleSubmit} className={"modal-form"}>
                            <input
                                name="title"
                                placeholder="Thread Title"
                                value={newThread.title}
                                onChange={handleChange}
                                required
                            />

                            <textarea
                                name="content"
                                placeholder="Thread Content"
                                value={newThread.content}
                                onChange={handleChange}
                                required
                            />

                            <div className={"modal-actions"}>
                                <button
                                    type="button"
                                    className="cancelBtn"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="saveBtn">
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
