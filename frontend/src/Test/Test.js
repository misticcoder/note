import { useState, useEffect, useContext } from "react";
import { apiFetch } from "../api";
import { AuthContext } from "../AuthContext";
import "./test.css";

const tasks = [
    {
        id: 1,
        title: "Find an Event Happening This Week",
        description: "Locate an event taking place this week that matches your interests.",
        requiredRole: null,
        answer: "Navigate through the platform and apply relevant filters (such as date or category) to display events happening this week.\n\nSuccess: You are able to view at least one event scheduled for this week."
    },
    {
        id: 2,
        title: "Search for a Specific Topic",
        description: "Use the search function to find a Hackathon or Machine Learning related event.",
        requiredRole: null,
        answer: "Use the search bar to enter keywords such as 'Hackathon' or 'Machine Learning'.\n\nSuccess: Relevant events appear in the results."
    },
    {
        id: 3,
        title: "Join an Event",
        description: "Sign up or mark interest in an event.",
        requiredRole: null,
        answer: "Open an event page and use the participation button (e.g. Going / Interested).\n\nSuccess: Your participation status updates and is reflected on the event page."
    },
    {
        id: 4,
        title: "Explore a Community Page",
        description: "Browse a community and review its announcements, members, and upcoming events.",
        requiredRole: null,
        answer: "Navigate to a community page and explore its different sections (Announcements, Members, Events, Social Groups).\n\nSuccess: You are able to view information across multiple tabs within the community."
    },
    {
        id: 5,
        title: "Check Notifications",
        description: "Review recent updates or activity notifications.",
        requiredRole: null,
        answer: "Access your profile and navigate to the Activity or Notifications section.\n\nSuccess: You can view recent updates or notifications."
    },

    // Leader Tasks

    {
        id: 6,
        title: "Create a Community Event",
        description: "Create and publish a new event for your community.",
        requiredRole: "Community Leader",
        answer: "Navigate to a community where you have leader permissions and create a new event.\n\nSuccess: The event is successfully published and visible on the platform."
    },
    {
        id: 7,
        title: "Manage Membership Requests",
        description: "Review and approve or reject a pending join request.",
        requiredRole: "Community Leader",
        answer: "Access the community management section and review pending membership requests.\n\nSuccess: The membership status updates after approval or rejection."
    },

    // Admin Tasks

    {
        id: 8,
        title: "Create a New Community",
        description: "Create and publish a new community.",
        requiredRole: "Admin",
        answer: "Use administrator controls to create a new community.\n\nSuccess: The community is successfully created and appears in the directory."
    },
    {
        id: 9,
        title: "Modify User Roles",
        description: "Assign or change a user’s platform role.",
        requiredRole: "Admin",
        answer: "Access the admin user management panel and modify a user's role.\n\nSuccess: The user’s permissions update accordingly."
    },
    {
        id: 10,
        title: "Personalise Your Interests",
        description: "Add interest tags to your profile and check if event recommendations update accordingly.",
        requiredRole: null,
        answer: "Navigate to your Profile and open the Edit Profile section.\n\nAdd one or more interest tags (e.g. Machine Learning, Sports, Hackathons).\n\nAfter saving, go to the Events Tab or Overview.\n\nSuccess: You can see events that match your selected interest tags appearing in recommendations or filtered views.\n\n Note: Refreshing in profile may result in blank screen. Try going back to the home and refresh again. "
    },

    {
        id: 11,
        title: "Confirm Attendance and Submit Event Feedback",
        description: "Publish a live event as Admin, confirm attendance as a student, and submit a rating or comment.",
        requiredRole: "Admin",
        answer: "Log in as an Admin and create a new event.\n\nSet the event start time to the current time so that it becomes 'Live'.\n\nOnce the event is live, reveal the attendance QR/code from the event overview section.\n\nLog in using a Student account and open the same event page.\n\nEnter the attendance code provided by the Admin to confirm attendance.\n\nAfter confirming attendance, navigate to the feedback or rating section.\n\nSubmit a rating and/or comment for the event.\n\nSuccess: The student's attendance is recorded and the submitted rating/comment appears on the event page."
    }



];


const roleColors = {
    "Community Leader": "#3b82f6",
    "Admin": "#ef4444",
};

const roleDescriptions = {
    "Community Leader": "Requires you to be a leader of at least one community",
    "Admin": "Requires administrator access to the platform",
};

export default function UsabilityTest() {

    const { user } = useContext(AuthContext);
    const [completed, setCompleted] = useState([]);
    const [revealedAnswers, setRevealedAnswers] = useState([]);

    const surveyUrl = "https://forms.office.com/Pages/ResponsePage.aspx?id=sAafLmkWiUWHiRCgaTTcYS_VjBLWGjZNk_QHvbrz_V1UQldERUxDNUkwRk5JR1RFU1YxTVZYV0NWVS4u";

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

    const toggleRevealAnswer = (e, id) => {
        e.preventDefault();
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

    // Group tasks by role
    const generalTasks = tasks.filter(t => !t.requiredRole);
    const leaderTasks = tasks.filter(t => t.requiredRole === "Community Leader");
    const adminTasks = tasks.filter(t => t.requiredRole === "Admin");

    const TaskSection = ({ title, tasks }) => (
        <>
            {tasks.length > 0 && (
                <>
                    <h2 className="task-section-title">{title}</h2>
                    {tasks.map(task => (
                        <div key={task.id} className="task-item">
                            <div className="task-content">
                                <div className="task-header">
                                    <div>
                                        <div className="task-title-row">
                                            <div className="task-title">{task.title}</div>
                                            {task.requiredRole && (
                                                <span
                                                    className="role-badge"
                                                    style={{ backgroundColor: roleColors[task.requiredRole] }}
                                                    title={roleDescriptions[task.requiredRole]}
                                                >
                                                    🔒 {task.requiredRole}
                                                </span>
                                            )}
                                        </div>
                                        <div className="task-desc">{task.description}</div>
                                        {task.requiredRole && (
                                            <div className="role-requirement">
                                                ⓘ {roleDescriptions[task.requiredRole]}
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={completed.includes(task.id)}
                                        onChange={() => toggleComplete(task.id)}
                                    />
                                </div>

                                <button
                                    className="reveal-btn"
                                    onClick={(e) => toggleRevealAnswer(e, task.id)}
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
                </>
            )}
        </>
    );

    return (
        <div className="usability-page">
            <div className="usability-card">
                <h1>System Familiarisation</h1>
                <p>
                    Complete the following tasks to explore the system. Tasks are organized by permission level.
                </p>

                <div className="progress-summary">
                    <div className="progress-item">
                        <span className="progress-label">General Tasks:</span>
                        <span className="progress-count">
                            {completed.filter(id => generalTasks.find(t => t.id === id)).length} / {generalTasks.length}
                        </span>
                    </div>
                    {leaderTasks.length > 0 && (
                        <div className="progress-item">
                            <span className="progress-label">Leader Tasks:</span>
                            <span className="progress-count">
                                {completed.filter(id => leaderTasks.find(t => t.id === id)).length} / {leaderTasks.length}
                            </span>
                        </div>
                    )}
                    {adminTasks.length > 0 && (
                        <div className="progress-item">
                            <span className="progress-label">Admin Tasks:</span>
                            <span className="progress-count">
                                {completed.filter(id => adminTasks.find(t => t.id === id)).length} / {adminTasks.length}
                            </span>
                        </div>
                    )}
                </div>

                <div className="task-list">
                    <TaskSection title="General Tasks (All Users)" tasks={generalTasks} />
                    <TaskSection title="Community Leader Tasks" tasks={leaderTasks} />
                    <TaskSection title="Administrator Tasks" tasks={adminTasks} />
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