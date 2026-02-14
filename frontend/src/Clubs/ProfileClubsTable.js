import "../styles/clubs.css";
import Dropdown from "../components/Dropdown";
export default function ProfileClubsTable({ clubs }) {
    if (!clubs || clubs.length === 0) {
        return <div className="muted">You are not a member of any clubs.</div>;
    }

    return (
        <div className="clubs-table">
            <div className="clubs-header">
                <div>#</div>
                <div>Category</div>
                <div>Name</div>
                <div>Role</div>
                <div>Members</div>
                <div>Events</div>
                <div>Upcoming</div>
            </div>

            {clubs.map((cl, idx) => (
                <div key={cl.id} className="clubs-row">
                    <div className="rank">{idx + 1}</div>
                    <div>{cl.category}</div>
                    <div>
                        <a href={`#/clubs/${cl.id}`}>{cl.name}</a>
                    </div>
                    <div>
                        {cl.role ? (
                            <div className={`role-badge role-${cl.role.toLowerCase()}`}>
                                {cl.role}
        </div>
                        ) : (
                            <span className="muted">Member</span>
                        )}
                    </div>

                    <div>
                        {cl.memberCount
                            ? <span className="rating-count">{cl.memberCount}</span>
                            : <span className="muted">No members</span>}
                    </div>
                    <div>
                        {cl.eventCount
                            ? <span className="rating-count">{cl.eventCount}</span>
                            : <span className="muted">No events</span>}
                    </div>
                    <div>
                        {cl.upcomingEventCount
                            ? <span className="rating-count">{cl.upcomingEventCount}</span>
                            : <span className="muted">None</span>}
                    </div>

                </div>
            ))}

            {clubs.length === 0 && (
                <div className="empty-row">No clubs found.</div>
            )}
        </div>
    );
}

const styles = {

    wrap: {padding: 20, maxWidth: 1100, margin: "0 auto"},
    headerRow: {display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 30},
    search: {padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6, marginRight: 12},
    backLink: {
        textDecoration: "none",
        border: "1px solid #ccc",
        padding: "6px 10px",
        borderRadius: 6,
        background: "#f8f8f8",
        color: "#333"
    },

    tableWrap: {background: "#fff", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden"},
    row: {display: "flex", gap: 8, padding: "10px 8px", borderBottom: "1px solid #eee", alignItems: "center"},
    head: {background: "#f5f5f5", fontWeight: "bold"},

    delBtn: {padding: "6px 10px", background: "#b00020", color: "#fff", border: "none", borderRadius: 6, marginLeft: 8},
    editBtn: {padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6},

    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
    },
    modal: {background: "#fff", padding: 20, borderRadius: 8, width: 480},
    input: {padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6},
    textarea: {padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6},
    cancelBtn: {padding: "6px 10px", background: "#ccc", border: "none", borderRadius: 6},
    saveBtn: {padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6}
};