import { useState, useEffect, useContext } from "react";
import { apiFetch } from "../api";
import { AuthContext } from "../AuthContext";
import "./test.css";

const tasks = [
    {
        id: 1,
        title: "Explore This Week's Events",
        description: "Navigate to Events Directory and Use filters",
        requiredRole: null,
        answer: "1. Click on 'Events' in the navigation menu\n2. Look for the filter options\n3. Select 'This Week' or use the date filter to show only this week's events"
    },
    {
        id: 2,
        title: "Browse a Community",
        description: "Open a club page and explore join options.",
        requiredRole: null,
        answer: "1. Navigate to 'Communities' in Home page or click 'Clubs' section in the navigation bar\n2. Select any community from the list\n3. Look for the 'Join' or 'Request to Join' button on the community page\n4. Log in as an admin or the club leader to view you pending request inside club overview (Optional)"
    },
    {
        id: 3,
        title: "Check Community Announcement/Members/Events/Social Groups/Report to Supervisor",
        description: "Find the new news from the leader, and upcoming events from a specific club, and checks if it has existing social waypoints",
        requiredRole: null,
        answer: "1. Open a specific community page\n2. Look for tabs like 'Announcements', 'Members', 'Events', and 'Social Groups'\n3. Click through each tab to view the content\n4. Check if social waypoints/groups are listed"
    },
    {
        id: 4,
        title: "Review Notifications (Partially Implemented, may notice few bugs)" ,
        description: "Visit your profile activity tab.",
        requiredRole: null,
        answer: "1. Click on your profile icon or avatar\n2. Navigate to the 'Activity' tab\n3. Review your recent notifications and activity"
    },
    {
        id: 5,
        title: "View Your Profile",
        description: "Review your profile overview.",
        requiredRole: null,
        answer: "1. Click on your profile icon/avatar in the navigation\n2. Select 'View Profile' or 'My Profile'\n3. Review your profile information, joined communities, and events, Edit Profile\n4. Try adding interest tags from the edit profile tab and see if you get recommended more events in the events tab or overview (optional)\n Note: You can find example Tags in the Events Directory under each event or the tag filter show all option. "
    },
    {
        id: 6,
        title: "Search for a Specific Event",
        description: "Use the search bar to find a Hackathon or ML-related event.",
        requiredRole: null,
        answer: "1. Locate the search bar (usually at the top of the page)\n2. Type keywords like 'Hackathon' or 'Machine Learning'\n3. Press Enter or click the search icon\n4. Browse through the search results"
    },
    {
        id: 7,
        title: "Filter Events by Tag",
        description: "Filter events by a specific tag (e.g. Sports or Academic).",
        requiredRole: null,
        answer: "1. Go to the Events page\n2. Look for filter options or tags section\n3. Search/Click on a tag like 'Sports', 'Academic', or any other category\n4. View the filtered results"
    },
    {
        id: 8,
        title: "Sign Up for an Event",
        description: "Open an event page and use the Join/Interest button.",
        requiredRole: null,
        answer: "1. Navigate to Events and select any event\n2. Open the event details page\n3. Look for 'going', 'maybe' button\n4. Click the button to sign up for the event\n5. Check the attendees tab in the Event Page and find yourself"
    },
    {
        id: 9,
        title: "Leave Feedback on an Event",
        description: "Submit a short rating or comment on an event.",
        requiredRole: null,
        answer: "1. Go to an event page (preferably one that has already occurred)\n2. Look for 'Comments', and 'Rate' section\n3. Provide a rating and/or comment\n\n Note: Rating is only allowed by an Attendee. So You can go to your profile, in events tab you can find an event that you have attended and try adding rating on that event.\n\n Note: Only Admins can view the QR Code for confirming attendance. And Users can see the code box when the event is Live"
    },
    {
        id: 10,
        title: "Explore Threads/Posts | P.S: DO NOT PROVIDE ANY PERSONAL/INAPPROPRIATE INFORMATION" ,
        description: "Add/Review existing thread or post | Add reaction/comment/reply | Try the reference Tags",
        requiredRole: null,
        answer: "1. Navigate to 'Discussion Threads' or 'Feed' section on Home Page\n2. Open a Thread/Post of your choice\n3. Review the information: Reactions/Contents/Reference tags/ Comments\n4. Add Reaction/Comment/Reply\n5. Create Your own Thread/Post\n\n Note: Post is allowed by any user only for testing purposes, Actual System will only allow admin and community leaders to advertise/announce contents."
    },
    {
        id: 11,
        title: "Create a New Event",
        description: "Create and publish a new event for your community.",
        requiredRole: "Community Leader",
        answer: "1. Navigate to your community page where you are a leader\n2. Look for 'Create Event' or '+' button\n3. Fill in event details (title, description, date, location)\n4. Set event visibility and registration options\n5. Click 'Publish' or 'Create Event'\n\n Note: You can find your clubs and role from the clubs tab of your profile page. If you dont have a club with the roles you want to explore, use a different login."
    },
    {
        id: 12,
        title: "Post a Community Announcement",
        description: "Share important news with your community members.",
        requiredRole: "Community Leader",
        answer: "1. Go to your community page (where you have leader permissions)\n2. Navigate to the 'Announcements' section\n3. Click 'New Announcement' or similar button\n4. Write your announcement message\n5. Post the announcement\n6. You can login as a different member and check the activity tab to see if the members received a notification."
    },
    {
        id: 13,
        title: "Manage Community Membership Requests",
        description: "Review and approve/reject pending join requests.",
        requiredRole: "Community Leader",
        answer: "1. Access your community's admin panel\n2. Navigate to 'Members' or 'Membership Requests' section\n3. Review pending requests\n4. Approve or reject requests with optional messages\n5. Check the updated member list"
    },

    {
        id: 15,
        title: "Create Events/Communities ||  Note: DO NOT PROVIDE ANY PERSONAL/INAPPROPRIATE INFORMATION",
        description: "Create and Publish Events and Communities with Different Responsibilities.",
        requiredRole: "Admin",
        answer: "1. Navigate to home Page \n2. Try Creating a Clubs or Event by clicking the ADD button\n3. Fill in the details (e.g. title, category, description, date, location) \n4. Try out Different Variations of Clubs and Events.\n5. Play Around"
    },
    {
        id: 16,
        title: "Manage User Roles",
        description: "Assign or modify user permissions across the platform.",
        requiredRole: "Admin",
        answer: "1. Access the Admin Panel\n2. Go to 'Users' section\n3. Search for or select a user\n4. Click 'Edit Roles' or 'Permissions'\n5. Assign roles (Admin, Student)\n6. Go to a Community Page\n 7. Assign roles to members"
    },
    {
        id: 17,
        title: "Moderate Content",
        description: "Moderate posts, comments, communities or events.",
        requiredRole: "Admin",
        answer: "1. Browse Through the platform\n 2. Review content: Threads/Posts/Clubs/Events \n3. Create Something Then Try Edit and Delete. \n4. Browse Events and Expose QR code for attendance. \n5. Browse Communities and Assign supervisor from the settings tab\n6. View the activity tab for Reports"
    },

    {
        id: 19,
        title: "Compare With Current System.  (If Possible)",
        description: "Think about how you would normally find this information (WhatsApp/Email/etc).",
        requiredRole: null,
        answer: "Reflect on your usual process:\n- How many steps does it take in your current system?\n- Do you need to check multiple platforms (WhatsApp groups, emails, social media)?\n- How easy is it to find specific information?\n- Compare the convenience and efficiency with this system"
    },
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