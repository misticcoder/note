import "../styles/SideNav.css";

export default function SideNav({ open, onClose }) {
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
                </nav>
            </aside>
        </>
    );
}
