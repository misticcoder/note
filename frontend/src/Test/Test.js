import { useState, useEffect, useContext } from "react";
import { apiFetch } from "../api";
import { AuthContext } from "../AuthContext";
import "./test.css";

const tasks = [
    { id: 1, title: "Explore This Week’s Events", description: "Navigate to Events and filter by week." },
    { id: 2, title: "Check a Sports Fixture", description: "Find the 5-a-side football fixtures." },
    { id: 3, title: "Browse a Community", description: "Open a club page and explore join options." },
    { id: 4, title: "Review Notifications", description: "Visit your profile activity tab." },
    { id: 5, title: "View Your Profile", description: "Review your profile overview." }
];

export default function UsabilityTest() {

    const { user } = useContext(AuthContext);
    const [completed, setCompleted] = useState([]);

    // Load saved progress
    useEffect(() => {
        if (!user) return;

        apiFetch("/api/familiarisation", {
            headers: { "X-User-Email": user.email }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const completedTasks = data
                    .filter(t => t.completed)
                    .map(t => t.taskId);
                setCompleted(completedTasks);
            })
            .catch(() => {});
    }, [user]);

    const toggleComplete = async (id) => {

        const newState = !completed.includes(id);

        setCompleted(prev =>
            newState
                ? [...prev, id]
                : prev.filter(x => x !== id)
        );

        try {
            await apiFetch(`/api/familiarisation/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Email": user.email
                },
                body: JSON.stringify({ completed: newState })
            });
        } catch (err) {
            console.error("Failed to update progress");
        }
    };

    const resetAll = async () => {
        try {
            await apiFetch("/api/familiarisation/clear", {
                method: "DELETE",
                headers: {
                    "X-User-Email": user.email
                }
            });

            setCompleted([]);
        } catch (err) {
            console.error("Failed to reset progress");
        }
    };

    return (
        <div className="usability-page">
            <div className="usability-card">
                <h1>System Familiarisation</h1>
                <p>
                    Complete the following tasks to explore the system.
                </p>

                <div className="task-list">
                    {tasks.map(task => (
                        <div key={task.id} className="task-item">
                            <div>
                                <div className="task-title">{task.title}</div>
                                <div className="task-desc">{task.description}</div>
                            </div>

                            <input
                                type="checkbox"
                                checked={completed.includes(task.id)}
                                onChange={() => toggleComplete(task.id)}
                            />
                        </div>
                    ))}
                </div>

                <div className="reset-container">
                    <button className="reset-btn" onClick={resetAll}>
                        Remove All Ticks
                    </button>
                </div>


                {completed.length === tasks.length && (
                    <div className="ready-message">
                        ✔ You have completed all familiarisation tasks.
                    </div>
                )}

            </div>
        </div>
    );
}
