import "../styles/SideNav.css";

export default function SideNav({ open, onClose }) {

    const surveyUrl = "https://forms.office.com/Pages/ResponsePage.aspx?id=sAafLmkWiUWHiRCgaTTcYS_VjBLWGjZNk_QHvbrz_V1UQldERUxDNUkwRk5JR1RFU1YxTVZYV0NWVS4u";

    const handleSurveyClick = () => {
        const confirmed = window.confirm(
            "You are about to open the usability survey in a new tab.\n\nContinue?"
        );

        if (confirmed) {
            window.open(surveyUrl, "_blank", "noopener,noreferrer");
        }
    };


    return (
        <>
            {/* Backdrop */}
            {open && <div className="sidenav-backdrop" onClick={onClose} />}

            {/* Sidebar */}
            <aside className={`sidenav ${open ? "open" : ""}`}>
                <div className="sidenav-header">
                    <span>Navigation</span>
                    <button onClick={onClose}>✕</button>
                </div>

                <nav className="sidenav-links">
                    <a href="#/">Home</a>
                    <a href="#/events">Events</a>
                    <a href="#/clubs">Clubs</a>
                    <a href="#/news">News</a>
                    <a href="#/threads">Threads</a>
                    <a href="#/usability-tasks">🧪 Usability Tasks</a>
                    <button
                        onClick={handleSurveyClick}
                        className="sidenav-link external-link"
                    >
                        📝 Usability Survey
                    </button>


                </nav>
            </aside>
        </>
    );
}
