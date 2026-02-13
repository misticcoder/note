import { useState, useEffect, useContext } from "react";
import { apiFetch } from "../api";
import { AuthContext } from "../AuthContext";
import "./test.css";

const tasks = [
    {
        id: 1,
        title: "Explore This Week's Events",
        description: "Navigate to Events and filter by week.",
        answer: "1. Click on 'Events' in the navigation menu\n2. Look for the filter options\n3. Select 'This Week' or use the date filter to show only this week's events"
    },
    {
        id: 2,
        title: "Browse a Community",
        description: "Open a club page and explore join options.",
        answer: "1. Navigate to 'Communities' or 'Clubs' section\n2. Select any community from the list\n3. Look for the 'Join' or 'Request to Join' button on the community page"
    },
    {
        id: 3,
        title: "Check Community Announcement/Members/Events/Social Groups",
        description: "Find the new news from the leader, and upcoming events from a specific club, and checks if it has existing social waypoints",
        answer: "1. Open a specific community page\n2. Look for tabs like 'Announcements', 'Members', 'Events', and 'Social Groups'\n3. Click through each tab to view the content\n4. Check if social waypoints/groups are listed"
    },
    {
        id: 4,
        title: "Review Notifications",
        description: "Visit your profile activity tab.",
        answer: "1. Click on your profile icon or avatar\n2. Navigate to the 'Activity' or 'Notifications' tab\n3. Review your recent notifications and activity"
    },
    {
        id: 5,
        title: "View Your Profile",
        description: "Review your profile overview.",
        answer: "1. Click on your profile icon/avatar in the navigation\n2. Select 'View Profile' or 'My Profile'\n3. Review your profile information, joined communities, and events"
    },
    {
        id: 6,
        title: "Search for a Specific Event",
        description: "Use the search bar to find a Hackathon or ML-related event.",
        answer: "1. Locate the search bar (usually at the top of the page)\n2. Type keywords like 'Hackathon' or 'Machine Learning'\n3. Press Enter or click the search icon\n4. Browse through the search results"
    },
    {
        id: 7,
        title: "Filter Events by Tag",
        description: "Filter events by a specific tag (e.g. Sports or Academic).",
        answer: "1. Go to the Events page\n2. Look for filter options or tags section\n3. Click on a tag like 'Sports', 'Academic', or any other category\n4. View the filtered results"
    },
    {
        id: 8,
        title: "Sign Up for an Event",
        description: "Open an event page and use the Join/Interest button.",
        answer: "1. Navigate to Events and select any event\n2. Open the event details page\n3. Look for 'Join', 'Register', or 'Express Interest' button\n4. Click the button to sign up for the event"
    },
    {
        id: 9,
        title: "Leave Feedback on an Event",
        description: "Submit a short rating or comment on an event.",
        answer: "1. Go to an event page (preferably one that has already occurred)\n2. Look for 'Leave Feedback', 'Rate', or 'Review' section\n3. Provide a rating and/or comment\n4. Submit your feedback"
    },
    {
        id: 10,
        title: "Find a Community to Join",
        description: "Search or browse the community directory.",
        answer: "1. Navigate to 'Communities' or 'Clubs' section\n2. Use the search bar or browse categories\n3. Look through available communities\n4. Select one that interests you and click to view details"
    },
    {
        id: 11,
        title: "Compare With Current System",
        description: "Think about how you would normally find this information (WhatsApp/Email/etc).",
        answer: "Reflect on your usual process:\n- How many steps does it take in your current system?\n- Do you need to check multiple platforms (WhatsApp groups, emails, social media)?\n- How easy is it to find specific information?\n- Compare the convenience and efficiency with this system"
    },
];

export default function UsabilityTest() {

    const { user } = useContext(AuthContext);
    const [completed, setCompleted] = useState([]);
    const [revealedAnswers, setRevealedAnswers] = useState([]);

    const surveyUrl = "https://forms.gle/YOUR_FORM_LINK";

    const handleSurveyClick = () => {
        const confirmed = window.confirm(
            "You are about to open the usability survey in a new tab.\n\nContinue?"
        );

        if (confirmed) {
            window.open(surveyUrl, "_blank", "noopener,noreferrer");
        }
    };

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

    const toggleRevealAnswer = (id) => {
        setRevealedAnswers(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
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
            setRevealedAnswers([]);
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
                            <div className="task-content">
                                <div className="task-header">
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

                                <button
                                    className="reveal-btn"
                                    onClick={() => toggleRevealAnswer(task.id)}
                                >
                                    {revealedAnswers.includes(task.id) ? "Hide Answer" : "Reveal Answer"}
                                </button>

                                {revealedAnswers.includes(task.id) && (
                                    <div className="answer-box">
                                        <strong>How to complete:</strong>
                                        <p style={{ whiteSpace: 'pre-line' }}>{task.answer}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reset-container">
                    <button className="reset-btn" onClick={resetAll}>
                        Remove All Ticks
                    </button>
                </div>

                {completed.length === tasks.length && (
                    <div className="completion-section">
                        <div className="ready-message">
                            ✔ All familiarisation tasks completed!
                        </div>
                        <div className="survey-card">
                            <div className="survey-icon">📝</div>
                            <h3>Next Step: Share Your Feedback</h3>
                            <p>Help us improve by completing a short usability survey about your experience with the system.</p>
                            <button
                                onClick={handleSurveyClick}
                                className="survey-btn"
                            >
                                Open Usability Survey
                                <span className="arrow">→</span>
                            </button>
                            <span className="survey-time">Takes ~ 5-10 minutes</span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}