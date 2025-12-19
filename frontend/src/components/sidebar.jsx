export default function Sidebar() {
    return (
        <aside className="sidebar">
            <h1 className="logo">VALO STATS</h1>

            <nav className="nav">
                <a className="nav-item active">Dashboard</a>
                <a className="nav-item">Matches</a>
                <a className="nav-item">Teams</a>
                <a className="nav-item">Players</a>
                <a className="nav-item">Events</a>
            </nav>
        </aside>
    );
}
