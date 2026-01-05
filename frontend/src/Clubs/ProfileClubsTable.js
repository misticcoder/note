export default function ProfileClubsTable({ clubs }) {
    if (!clubs || clubs.length === 0) {
        return <div className="muted">You are not a member of any clubs.</div>;
    }

    return (
        <div style={styles.tableWrap}>
            <div style={{ ...styles.row, ...styles.head }}>
                <div style={{ width: 120 }}>Category</div>
                <div style={{ flex: 2 }}>Club</div>
                <div style={{ width: 140 }}>Your Role</div>
                <div style={{ width: 120 }}>Members</div>
                <div style={{ width: 120 }}>Events</div>
            </div>

            {clubs.map((cl) => (
                <div key={cl.id} style={styles.row}>
                    <div style={{ width: 120 }}>{cl.category || "—"}</div>

                    <div style={{ flex: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <a
                            href={`#/clubs/${cl.id}`}
                            style={{ textDecoration: "none", fontWeight: 500 }}
                        >
                            {cl.name}
                        </a>
                    </div>

                    <div style={{ width: 140 }}>{cl.role}</div>
                    <div style={{ width: 120 }}>{cl.memberCount}</div>
                    <div style={{ width: 120 }}>{cl.eventCount}</div>
                </div>
            ))}
        </div>
    );
}

const styles = {

    wrap: { padding: 20, maxWidth: 1100, margin: "0 auto" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 30 },
    search: { padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6, marginRight: 12 },
    backLink: { textDecoration: "none", border: "1px solid #ccc", padding: "6px 10px", borderRadius: 6, background: "#f8f8f8", color: "#333" },

    tableWrap: { background: "#fff", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" },
    row: { display: "flex", gap: 8, padding: "10px 8px", borderBottom: "1px solid #eee", alignItems: "center" },
    head: { background: "#f5f5f5", fontWeight: "bold" },

    delBtn: { padding: "6px 10px", background: "#b00020", color: "#fff", border: "none", borderRadius: 6, marginLeft: 8 },
    editBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6 },

    backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modal: { background: "#fff", padding: 20, borderRadius: 8, width: 480 },
    input: { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 },
    textarea: { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 },
    cancelBtn: { padding: "6px 10px", background: "#ccc", border: "none", borderRadius: 6 },
    saveBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6 }
};