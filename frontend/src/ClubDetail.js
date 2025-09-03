import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

export default function ClubDetail() {
    const { user } = useContext(AuthContext);
    const [club, setClub] = useState(null);
    const [news, setNews] = useState([]);
    const [members, setMembers] = useState([]);
    const [pending, setPending] = useState([]);
    const [users, setUsers] = useState([]); // for username/email lookup
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [myStatus, setMyStatus] = useState({ isMember: false, hasPending: false, requestId: null });

    const clubId = (() => {
        const m = (window.location.hash || "").match(/^#\/clubs\/(\d+)/i);
        return m ? Number(m[1]) : null;
    })();

    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";
    const isLeader = !!user && members.some(m => m.userId === user.id && m.role === "LEADER");
    const canManage = isAdmin || isLeader;

    // derive membership from both sources (status + members list)
    const isMemberFromList = !!user && members.some(m => m.userId === user.id);
    const effectiveIsMember = myStatus.isMember || isMemberFromList;


    const requestJoinClub = async () => {
        if (!user) { alert("Please log in to request to join."); return; }
        const res = await fetch(`/api/clubs/${clubId}/join?requesterEmail=${encodeURIComponent(user.email)}`, { method: "POST" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) { alert(body.message || "Failed to send request"); return; }

        // Refresh my status (best)…
        const st = await fetch(`/api/clubs/${clubId}/status?requesterEmail=${encodeURIComponent(user.email)}`).then(r => r.json());
        setMyStatus(st);

        // …and (optionally) reflect in pending for managers
        setPending(prev => [...prev, { id: body.id ?? st.requestId ?? Date.now(), userId: user.id }]);
    };

    const cancelJoinRequest = async () => {
        if (!user || !myStatus.requestId) return;
        const res = await fetch(
            `/api/clubs/${clubId}/join-requests/${myStatus.requestId}?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "DELETE" }
        );
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            alert(b.message || "Failed to cancel request");
            return;
        }
        // Refresh my status
        setMyStatus({ isMember: myStatus.isMember, hasPending: false, requestId: null });
        // Remove from manager view if present
        setPending(prev => prev.filter(p => p.id !== myStatus.requestId && p.userId !== user.id));
    };

    // NEW: Leave the club if already a member
    const leaveClub = async () => {
        if (!user) return;
        if (!window.confirm("Are you sure you want to leave this club?")) return;

        // Prevent leaders/admins from using Leave here if you want; otherwise they can leave too.
        // Example guard (optional):
        // if (isLeader) { alert("Leaders cannot leave. Transfer leadership first."); return; }

        const res = await fetch(
            `/api/clubs/${clubId}/leave?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "POST" }
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Failed to leave club");
            return;
        }

        // Update local state: no longer a member
        setMyStatus({ isMember: false, hasPending: false, requestId: null });
        setMembers(prev => prev.filter(m => m.userId !== user.id));
    };

    // Build a quick lookup: userId -> {username, email, role}
    const userMap = useMemo(() => {
        const map = new Map();
        (users || []).forEach(u => map.set(u.id, u));
        return map;
    }, [users]);

    // Derived lists: leaders first, then members
    const sortedMembers = useMemo(() => {
        const arr = [...members];
        arr.sort((a, b) => {
            if (a.role === b.role) return 0;
            return a.role === "LEADER" ? -1 : 1;
        });
        return arr;
    }, [members]);

    useEffect(() => {
        if (!clubId) return;
        (async () => {
            try {
                const [c, n, m] = await Promise.all([
                    fetch(`/api/clubs/${clubId}`).then(r => r.json()),
                    fetch(`/api/clubs/${clubId}/news`).then(r => r.json()),
                    fetch(`/api/clubs/${clubId}/members`).then(r => r.json())
                ]).catch(() => [null, [], []]);

                setClub(c);
                setNews(Array.isArray(n) ? n : []);
                setMembers(Array.isArray(m) ? m : []);

                // Load users (for names/emails) once
                const usersRes = await fetch("/api/users");
                const usersBody = usersRes.ok ? await usersRes.json() : [];
                setUsers(Array.isArray(usersBody) ? usersBody : (usersBody.content || []));

                if (user) {
                    // managers still load full pending list
                    fetch(`/api/clubs/${clubId}/join-requests?requesterEmail=${encodeURIComponent(user.email)}`)
                        .then(r => (r.ok ? r.json() : []))
                        .then(setPending)
                        .catch(() => setPending([]));

                    // everyone can load their own status
                    fetch(`/api/clubs/${clubId}/status?requesterEmail=${encodeURIComponent(user.email)}`)
                        .then(r => r.ok ? r.json() : { isMember:false, hasPending:false, requestId:null })
                        .then(setMyStatus)
                        .catch(() => setMyStatus({ isMember:false, hasPending:false, requestId:null }));

                    if (canManage) {
                        fetch(`/api/clubs/${clubId}/join-requests?requesterEmail=${encodeURIComponent(user.email)}`)
                            .then(r => (r.ok ? r.json() : []))
                            .then(setPending)
                            .catch(() => setPending([]));
                    } else {
                        setPending([]); // clear for non-managers
                    }
                } else {
                    setMyStatus({ isMember:false, hasPending:false, requestId:null });
                    setPending([]);
                }

            } catch {
                // no-op; basic fallback already set
            }
        })();
    }, [clubId, user?.email]);

    const decide = async (requestId, decision) => {
        const url = `/api/clubs/${clubId}/join-requests/${requestId}/decision?requesterEmail=${encodeURIComponent(
            user.email
        )}&decision=${decision}`;
        const res = await fetch(url, { method: "POST" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Failed");
            return;
        }
        // Refresh members + pending
        const [m, p] = await Promise.all([
            fetch(`/api/clubs/${clubId}/members`).then(r => r.json()),
            fetch(
                `/api/clubs/${clubId}/join-requests?requesterEmail=${encodeURIComponent(user.email)}`
            ).then(r => r.json())
        ]);
        setMembers(Array.isArray(m) ? m : []);
        setPending(Array.isArray(p) ? p : []);
    };

    const postNews = async e => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        const res = await fetch(
            `/api/clubs/${clubId}/news?requesterEmail=${encodeURIComponent(user.email)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), content: content.trim() })
            }
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Failed");
            return;
        }
        setNews(prev => [body, ...prev]);
        setTitle("");
        setContent("");
    };

    const deleteNews = async newsId => {
        const res = await fetch(
            `/api/clubs/${clubId}/news/${newsId}?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "DELETE" }
        );
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            alert(b.message || "Failed");
            return;
        }
        setNews(prev => prev.filter(n => n.id !== newsId));
    };

    if (!clubId)
        return (
            <div style={s.page}>
                <a href="#/clubs" style={s.backLink}>
                    ← Back
                </a>
            </div>
        );
    if (!club)
        return (
            <div style={s.page}>
                <div style={s.card}>Loading…</div>
            </div>
        );

    // Helper to show a user label from userId
    const userLabel = (uid) => {
        const u = userMap.get(uid);
        if (!u) return `User #${uid}`;
        return `${u.username} (${u.email})`; //shows members & Leaders username and their email.
    };

    const leaderNames = sortedMembers
        .filter(m => m.role === "LEADER")
        .map(m => userLabel(m.userId));

    return (
        <div style={s.page}>
            <a href="#/clubs" style={s.backLink}>
                ← Back
            </a>

            {/* Club header */}
            <div style={{ ...s.card, ...s.headerCard }}>
                <div style={s.headerTop}>
                    <h2 style={s.title}>{club.name}</h2>
                    <div style={{display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap"}}>
                        <div style={s.chips}>
                            {leaderNames.length > 0 ? (
                                leaderNames.map((ln, i) => (
                                    <span key={i} style={s.leaderChip} title="Club Leader">
                                        ⭐ {ln}
                                    </span>
                                ))
                            ) : (
                                <span style={s.leaderChipMuted}>No leader assigned</span>
                            )}
                        </div>

                        {/* Join/Cancel/Leave button logic */}
                        { /* change '!canManage && user' to 'user' if leaders/admins should also be able to leave */ }
                        {(!canManage && user) && (
                            effectiveIsMember ? (
                                <button onClick={leaveClub} style={s.dangerBtn}>Leave</button>
                            ) : myStatus.hasPending ? (
                                <button onClick={cancelJoinRequest} style={s.dangerBtn}>Cancel Request</button>
                            ) : (
                                <button onClick={requestJoinClub} style={s.primaryBtn}>Join</button>
                            )
                        )}


                    </div>

                </div>
                <p style={s.desc}>{club.description}</p>
            </div>

            <div style={s.grid}>
                {/* News */}
                <div>
                    <div style={s.sectionHeader}>
                        <h3 style={s.h3}>Club News</h3>
                    </div>

                    {canManage && (
                        <form onSubmit={postNews} style={s.newsForm}>
                            <input
                                placeholder="Title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                style={s.input}
                            />
                            <textarea
                                placeholder="Content"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                required
                                style={s.textarea}
                            />
                            <div style={{ textAlign: "right" }}>
                                <button type="submit" style={s.primaryBtn}>
                                    Post
                                </button>
                            </div>
                        </form>
                    )}

                    {news.length === 0 && <div style={s.card}>No news yet.</div>}

                    {news.map(n => (
                        <div key={n.id} style={s.card}>
                            <div style={s.cardHead}>
                                <strong style={{ fontSize: 16 }}>{n.title}</strong>
                                {canManage && (
                                    <button onClick={() => deleteNews(n.id)} style={s.dangerBtn}>
                                        Delete
                                    </button>
                                )}
                            </div>
                            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{n.content}</div>
                            <div style={s.meta}>
                                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Members & Pending */}
                <div>
                    <div style={s.sectionHeader}>
                        <h3 style={s.h3}>Members</h3>
                    </div>

                    <div style={s.card}>
                        <ul style={s.list}>
                            {sortedMembers.map(m => (
                                <li key={m.id} style={s.listItem}>
                                    <span>{userLabel(m.userId)}</span>
                                    {m.role === "LEADER" ? (
                                        <span style={s.badgeLeader}>LEADER</span>
                                    ) : (
                                        <span style={s.badge}>MEMBER</span>
                                    )}
                                </li>
                            ))}
                            {sortedMembers.length === 0 && <li style={s.muted}>No members yet.</li>}
                        </ul>
                    </div>

                    {canManage && (
                        <>
                            <div style={s.sectionHeader}>
                                <h3 style={s.h3}>Pending Requests</h3>
                            </div>

                            <div style={s.card}>
                                {pending.length === 0 && <div style={s.muted}>No pending requests.</div>}
                                {pending.map(r => (
                                    <div key={r.id} style={s.pendingRow}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{userLabel(r.userId)}</div>
                                            <div style={s.meta}>Request ID: {r.id}</div>
                                        </div>
                                        <div style={s.actions}>
                                            <button onClick={() => decide(r.id, "approve")} style={s.primaryBtnSm}>
                                                Approve
                                            </button>
                                            <button onClick={() => decide(r.id, "reject")} style={s.dangerBtnSm}>
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---- styles ---- */
const s = {
    page: { maxWidth: 1100, margin: "0 auto", padding: 20 },
    backLink: {
        textDecoration: "none",
        border: "1px solid #ddd",
        padding: "6px 10px",
        borderRadius: 8,
        background: "#f8f8f8",
        color: "#333",
        display: "inline-block",
        marginBottom: 10
    },

    card: {
        background: "#fff",
        border: "1px solid #e6e6e6",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        marginBottom: 12
    },
    headerCard: { paddingTop: 18, paddingBottom: 18 },
    headerTop: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" },
    title: { margin: 0, fontSize: 24, lineHeight: 1.25 },
    desc: { marginTop: 8, color: "#444", lineHeight: 1.6 },

    chips: { display: "flex", gap: 8, flexWrap: "wrap" },
    leaderChip: {
        background: "#0b57d0",
        color: "#fff",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        boxShadow: "0 2px 8px rgba(11,87,208,0.2)"
    },
    leaderChipMuted: {
        background: "#e9eefc",
        color: "#3b5bcc",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12
    },

    grid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" },
    sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0" },
    h3: { margin: 0 },

    newsForm: {
        ...cardLike(),
        display: "grid",
        gap: 10,
        marginBottom: 12
    },

    input: {
        width: "90%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        outline: "none"
    },
    textarea: {
        width: "90%",
        minHeight: 110,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        outline: "none",
        resize: "vertical"
    },

    primaryBtn: button("#0b57d0", "#fff"),
    dangerBtn: button("#b00020", "#fff"),
    primaryBtnSm: button("#0b57d0", "#fff", true),
    dangerBtnSm: button("#b00020", "#fff", true),

    cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    meta: { opacity: 0.7, fontSize: 12, marginTop: 6 },

    list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 },
    listItem: {
        padding: "8px 10px",
        border: "1px solid #eee",
        borderRadius: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    muted: { color: "#777" },

    badge: {
        background: "#eef2f7",
        color: "#374151",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12
    },
    badgeLeader: {
        background: "#fde68a",
        color: "#7c4a00",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700
    },

    pendingRow: {
        border: "1px solid #eee",
        borderRadius: 10,
        padding: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
    },
    actions: { display: "flex", gap: 8 }
};

// little helpers for styles
function button(bg, fg, small = false) {
    return {
        background: bg,
        color: fg,
        border: "none",
        borderRadius: 10,
        padding: small ? "6px 10px" : "8px 12px",
        cursor: "pointer",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
    };
}
function cardLike() {
    return {
        background: "#fff",
        border: "1px solid #e6e6e6",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)"
    };
}
