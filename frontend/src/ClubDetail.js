import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import "./styles/clubs.css";
import ClubHeader from "./ClubHeader";
import EventTable from "./Events/EventTable";
import {apiFetch} from "./api";

import { useEventActions } from "./hooks/useEventActions";
import EditEventModal from "./Events/EditEventModal";

import "./styles/modal.css";



export default function ClubDetail() {
    const { user } = useContext(AuthContext);
    const [club, setClub] = useState(null);
    const [news, setNews] = useState([]);
    const [members, setMembers] = useState([]);
    const [pending, setPending] = useState([]);
    const [users, setUsers] = useState([]); // for username/email lookup
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [events, setEvents] = useState([]);

    const {
        editingEvent,
        setEditingEvent,
        saveEvent,
        deleteEvent
    } = useEventActions({ user, setEvents });


    const [myStatus, setMyStatus] = useState({
        isMember: false,
        hasPending: false,
        requestId: null,
    });

    // UI: which member's action menu is open
    const [openMember, setOpenMember] = useState(null); // userId or null

    const clubRoute = (() => {
        const m = (window.location.hash || "").match(/^#\/clubs\/(\d+)(?:\/(\w+))?/i);
        return {
            clubId: m ? Number(m[1]) : null,
            tab: m?.[2] || "overview",
        };
    })();

    const clubId = clubRoute.clubId;
    const activeTab = clubRoute.tab;


    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";
    const isCoLeader =
        !!user && members.some((m) => m.userId === user.id && m.role === "CO_LEADER");
    const isLeader =
        !!user && members.some((m) => m.userId === user.id && m.role === "LEADER");

    // High-level capability flags
    const canManage = isAdmin || isLeader; // keep if you reference elsewhere
    const canSeeActionMenu = !!user && (isAdmin || isLeader || isCoLeader);

    const canPostNews = isAdmin || isLeader || isCoLeader; // co-leaders can post
    const canApproveRequests = isAdmin || isLeader; // pending requests only for admin/leader

    // derive membership from both sources (status + members list)
    const isMemberFromList = !!user && members.some((m) => m.userId === user.id);
    const effectiveIsMember = myStatus.isMember || isMemberFromList;

    const canCreateEvent = isAdmin || isLeader || isCoLeader;
    const [showCreateEvent, setShowCreateEvent] = useState(false);


    const requestJoinClub = async () => {
        if (!user) {
            alert("Please log in to request to join.");
            return;
        }
        const res = await apiFetch(
            `/api/clubs/${clubId}/join?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "POST" }
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Failed to send request");
            return;
        }

        const st = await apiFetch(
            `/api/clubs/${clubId}/status?requesterEmail=${encodeURIComponent(user.email)}`
        ).then((r) => r.json());
        setMyStatus(st);
        setPending((prev) => [
            ...prev,
            { id: body.id ?? st.requestId ?? Date.now(), userId: user.id },
        ]);
    };

    const cancelJoinRequest = async () => {
        if (!user || !myStatus.requestId) return;
        const res = await apiFetch(
            `/api/clubs/${clubId}/join-requests/${myStatus.requestId}?requesterEmail=${encodeURIComponent(
                user.email
            )}`,
            { method: "DELETE" }
        );
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            alert(b.message || "Failed to cancel request");
            return;
        }
        setMyStatus({ isMember: myStatus.isMember, hasPending: false, requestId: null });
        setPending((prev) => prev.filter((p) => p.id !== myStatus.requestId && p.userId !== user.id));
    };

    const leaveClub = async () => {
        if (!user) return;
        if (isLeader) {
            alert("You are the club leader. Please transfer leadership to another member before leaving this club.");
            return;
        }
        if (!window.confirm("Are you sure you want to leave this club?")) return;

        const res = await apiFetch(
            `/api/clubs/${clubId}/leave?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "POST" }
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Failed to leave club");
            return;
        }
        setMyStatus({ isMember: false, hasPending: false, requestId: null });
        setMembers((prev) => prev.filter((m) => m.userId !== user.id));
    };

    // lookup: userId -> user
    const userMap = useMemo(() => {
        const map = new Map();
        (users || []).forEach((u) => map.set(u.id, u));
        return map;
    }, [users]);

    // Sort: LEADER -> CO_LEADER -> MEMBER
    const sortedMembers = useMemo(() => {
        const rank = (r) => (r === "LEADER" ? 0 : r === "CO_LEADER" ? 1 : 2);
        return [...members].sort((a, b) => {
            const ra = rank(a.role || "MEMBER");
            const rb = rank(b.role || "MEMBER");
            if (ra !== rb) return ra - rb;
            return 0;
        });
    }, [members]);

    useEffect(() => {
        if (!clubId) return;
        (async () => {
            try {
                const [c, n, m] = await Promise.all([
                    apiFetch(`/api/clubs/${clubId}`).then((r) => r.json()),
                    apiFetch(`/api/clubs/${clubId}/news`).then((r) => r.json()),
                    apiFetch(`/api/clubs/${clubId}/members`).then((r) => r.json()),
                ]).catch(() => [null, [], []]);

                setClub(c);
                setNews(Array.isArray(n) ? n : []);
                setMembers(Array.isArray(m) ? m : []);

                // users (for labels)
                const usersRes = await apiFetch("/api/users");
                const usersBody = usersRes.ok ? await usersRes.json() : [];
                setUsers(Array.isArray(usersBody) ? usersBody : usersBody.content || []);

                if (user) {
                    // status for current user
                    apiFetch(
                        `/api/clubs/${clubId}/status?requesterEmail=${encodeURIComponent(user.email)}`
                    )
                        .then((r) =>
                            r.ok ? r.json() : { isMember: false, hasPending: false, requestId: null }
                        )
                        .then(setMyStatus)
                        .catch(() =>
                            setMyStatus({ isMember: false, hasPending: false, requestId: null })
                        );

                    // only approvers (admin/leader) can see pending requests
                    if (canApproveRequests) {
                        apiFetch(
                            `/api/clubs/${clubId}/join-requests?requesterEmail=${encodeURIComponent(
                                user.email
                            )}`
                        )
                            .then((r) => (r.ok ? r.json() : []))
                            .then(setPending)
                            .catch(() => setPending([]));
                    } else {
                        setPending([]);
                    }
                } else {
                    setMyStatus({ isMember: false, hasPending: false, requestId: null });
                    setPending([]);
                }
            } catch {
                // noop
            }
        })();
    }, [clubId, user?.email, canApproveRequests]);

    useEffect(() => {
        if (!clubId) return;
        if (!user) return;

        // Wait until role / membership is known
        const roleResolved =
            isAdmin ||
            isLeader ||
            isCoLeader ||
            myStatus.isMember;

        if (!roleResolved) return;

        const load = async () => {
            try {
                const url =
                    `/api/events/club/${clubId}?status=all` +
                    `&requesterEmail=${encodeURIComponent(user.email)}`;

                const res = await apiFetch(url);
                if (!res.ok) throw new Error();

                const data = await res.json();
                setEvents(Array.isArray(data) ? data : []);
            } catch {
                setEvents([]);
            }
        };

        load();
    }, [
        clubId,
        user?.email,
        isAdmin,
        isLeader,
        isCoLeader,
        myStatus.isMember
    ]);

    const decide = async (requestId, decision) => {
        const url = `/api/clubs/${clubId}/join-requests/${requestId}/decision?requesterEmail=${encodeURIComponent(
            user.email
        )}&decision=${decision}`;
        const res = await apiFetch(url, { method: "POST" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Failed");
            return;
        }

        const [m, p] = await Promise.all([
            apiFetch(`/api/clubs/${clubId}/members`).then((r) => r.json()),
            apiFetch(
                `/api/clubs/${clubId}/join-requests?requesterEmail=${encodeURIComponent(user.email)}`
            ).then((r) => r.json()),
        ]);
        setMembers(Array.isArray(m) ? m : []);
        setPending(Array.isArray(p) ? p : []);
    };

    const postNews = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        const res = await apiFetch(
            `/api/clubs/${clubId}/news?requesterEmail=${encodeURIComponent(user.email)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), content: content.trim() }),
            }
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Failed");
            return;
        }
        setNews((prev) => [body, ...prev]);
        setTitle("");
        setContent("");
    };

    const deleteNews = async (newsId) => {
        const res = await apiFetch(
            `/api/clubs/${clubId}/news/${newsId}?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "DELETE" }
        );
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            alert(b.message || "Failed");
            return;
        }
        setNews((prev) => prev.filter((n) => n.id !== newsId));
    };

    // --- Role changes & moderation ---

    // ADMIN: set target as the single LEADER (others become MEMBER locally)
    const makeLeader = async (targetUserId) => {
        if (!user) return;
        try {
            const res = await apiFetch(
                `/api/clubs/${clubId}/members/${targetUserId}/make-leader?requesterEmail=${encodeURIComponent(
                    user.email
                )}`,
                { method: "POST" }
            );
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(body.message || "Failed to set leader");
                return;
            }
            setMembers(prev =>
                prev.map(m => {
                    if (m.userId === targetUserId) {
                        return { ...m, role: "LEADER" };
                    }
                    if (m.role === "LEADER") {
                        return { ...m, role: "CO_LEADER" };
                    }
                    return { ...m, role: "MEMBER" };
                })
            );

            setOpenMember(null);
        } catch {
            alert("Failed to set leader");
        }
    };

    // LEADER/ADMIN: promote MEMBER -> CO_LEADER
    const makeCoLeader = async (targetUserId) => {
        if (!user) return;
        try {
            const res = await apiFetch(
                `/api/clubs/${clubId}/members/${targetUserId}/make-co_leader?requesterEmail=${encodeURIComponent(
                    user.email
                )}`,
                { method: "POST" }
            );
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(body.message || "Failed to promote");
                return;
            }
            setMembers((prev) =>
                prev.map((m) => (m.userId === targetUserId ? { ...m, role: "CO_LEADER" } : m))
            );
            setOpenMember(null);
        } catch {
            alert("Failed to promote");
        }
    };

    // DEMOTE to MEMBER (Leader can demote CO_LEADER; Admin can demote CO_LEADER)
    const makeMember = async (targetUserId) => {
        if (!user) return;
        try {
            const res = await apiFetch(
                `/api/clubs/${clubId}/members/${targetUserId}/make-member?requesterEmail=${encodeURIComponent(
                    user.email
                )}`,
                { method: "POST" }
            );
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(body.message || "Failed to demote");
                return;
            }
            setMembers((prev) =>
                prev.map((m) => (m.userId === targetUserId ? { ...m, role: "MEMBER" } : m))
            );
            setOpenMember(null);
        } catch {
            alert("Failed to demote");
        }
    };

    // Kick member from club
    const kickMember = async (targetUserId) => {
        if (!user) return;
        if (!window.confirm("Remove this member from the club?")) return;
        try {
            const res = await apiFetch(
                `/api/clubs/${clubId}/members/${targetUserId}?requesterEmail=${encodeURIComponent(
                    user.email
                )}`,
                { method: "DELETE" }
            );
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(body.message || "Failed to remove member");
                return;
            }

            setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
            setOpenMember(null);
        } catch {
            alert("Failed to remove member");
        }
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

    const userLabel = (uid) => {
        const u = userMap.get(uid);
        if (!u) return `User #${uid}`;
        return `${u.username} (${u.email})`;
    };

    const leaderNames = sortedMembers
        .filter((m) => m.role === "LEADER")
        .map((m) => userLabel(m.userId));

    return (
        <div className={"page"}>
            <div className={"container"}>
                {/* Club header */}
                <ClubHeader
                    club={{
                        id: club.id,
                        name: club.name,
                        shortName: club.tag,
                        website: club.website,
                        twitter: club.twitter,
                        country: club.country,
                        logoUrl: club.logoUrl,
                        description: club.description
                    }}
                    leaders={leaderNames}
                    membership={{
                        isMember: effectiveIsMember,
                        hasPending: myStatus.hasPending,
                        isLeader
                    }}
                    activeTab={activeTab}
                    onJoin={requestJoinClub}
                    onLeave={leaveClub}
                    onCancelRequest={cancelJoinRequest}
                />

                {activeTab === "overview" && (
                    <div style={s.grid}>
                        {/* News */}
                        <div>
                            <div style={s.sectionHeader}>
                                <h3 style={s.h3}>Club News</h3>
                            </div>

                            {canPostNews && (
                                <form onSubmit={postNews} style={s.newsForm}>
                                    <input
                                        placeholder="Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        style={s.input}
                                    />
                                    <textarea
                                        placeholder="Content"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                        style={s.textarea}
                                    />
                                    <div style={{textAlign: "right"}}>
                                        <button type="submit" style={s.primaryBtn}>
                                            Post
                                        </button>
                                    </div>
                                </form>
                            )}

                            {news.length === 0 && <div style={s.card}>No news yet.</div>}

                            {news.map((n) => (
                                <div key={n.id} style={s.card}>
                                    <div style={s.cardHead}>
                                        <strong style={{fontSize: 16}}>{n.title}</strong>
                                        {canPostNews && (
                                            <button onClick={() => deleteNews(n.id)} style={s.dangerBtn}>
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <div style={{whiteSpace: "pre-wrap", lineHeight: 1.5}}>{n.content}</div>
                                    <div
                                        style={s.meta}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
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
                                    {sortedMembers.map((m) => {
                                        const isThisLeader = m.role === "LEADER";
                                        const isThisCoLeader = m.role === "CO_LEADER";
                                        const isThisMember = !isThisLeader && !isThisCoLeader;
                                        const isSelf = user && m.userId === user.id;
                                        const menuOpen = openMember === m.userId;

                                        const badge = isThisLeader ? (
                                            <span style={s.badgeLeader}>LEADER</span>
                                        ) : isThisCoLeader ? (
                                            <span style={s.badgeCoLeader}>CO-LEADER</span>
                                        ) : (
                                            <span style={s.badge}>MEMBER</span>
                                        );

                                        // Permissions vs this target
                                        const canKickThisUser =
                                            isAdmin || (isLeader && !isThisLeader) || (isCoLeader && isThisMember);

                                        const canPromoteToCoLeader = (isLeader || isAdmin) && isThisMember;

                                        // Admin can demote CO_LEADER; Leader can demote CO_LEADER
                                        const canDemoteToMember =
                                            (isLeader && isThisCoLeader) || (isAdmin && !isSelf && isThisCoLeader);


                                        return (
                                            <li key={m.id} style={{...s.listItem, position: "relative"}}>
                    <span
                        onClick={() => setOpenMember(menuOpen ? null : m.userId)}
                        style={{cursor: canSeeActionMenu ? "pointer" : "default"}}
                    >
                      {userLabel(m.userId)}
                    </span>

                                                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                                    {badge}
                                                    {canSeeActionMenu && !isSelf && (
                                                        <button
                                                            onClick={() => setOpenMember(menuOpen ? null : m.userId)}
                                                            style={s.primaryBtnSm}
                                                            title="Manage member"
                                                        >
                                                            ⋮
                                                        </button>
                                                    )}
                                                </div>

                                                {canSeeActionMenu && !isSelf && menuOpen && (
                                                    <div style={s.menu}>
                                                        {/* Admin: set sole LEADER */}
                                                        {isAdmin && !isThisLeader && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeLeader(m.userId)}
                                                            >
                                                                Make Leader (Admin)
                                                            </button>
                                                        )}
                                                        {isAdmin && !isThisCoLeader && !isThisMember && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeCoLeader(m.userId)}
                                                            >
                                                                Demote to Co-leader
                                                            </button>
                                                        )}

                                                        {/* Leader/Admin: promote MEMBER -> CO_LEADER */}
                                                        {canPromoteToCoLeader && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeCoLeader(m.userId)}
                                                            >
                                                                Promote to Co-leader
                                                            </button>
                                                        )}

                                                        {/* Leader or Admin: CO_LEADER -> MEMBER */}
                                                        {canDemoteToMember && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeMember(m.userId)}
                                                            >
                                                                Demote to Member
                                                            </button>
                                                        )}

                                                        {/* Kick */}
                                                        {canKickThisUser && (
                                                            <button
                                                                style={{...s.menuItem, color: "#b00020"}}
                                                                onClick={() => kickMember(m.userId)}
                                                            >
                                                                Kick
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                    {sortedMembers.length === 0 && <li style={s.muted}>No members yet.</li>}
                                </ul>
                            </div>

                            {canApproveRequests && (
                                <>
                                    <div style={s.sectionHeader}>
                                        <h3 style={s.h3}>Pending Requests</h3>
                                    </div>
                                    <div style={s.card}>
                                        {pending.length === 0 && <div style={s.muted}>No pending requests.</div>}
                                        {pending.map((r) => (
                                            <div key={r.id} style={s.pendingRow}>
                                                <div>
                                                    <div style={{fontWeight: 600}}>{userLabel(r.userId)}</div>
                                                    <div style={s.meta}>Request ID: {r.id}</div>
                                                </div>
                                                <div style={s.actions}>
                                                    <button
                                                        onClick={() => decide(r.id, "approve")}
                                                        style={s.primaryBtnSm}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => decide(r.id, "reject")}
                                                        style={s.dangerBtnSm}
                                                    >
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
                )}

                {activeTab === "news" && (
                    <div>
                        <div style={s.sectionHeader}>
                            <h3 style={s.h3}>Club News</h3>
                        </div>

                        {canPostNews && (
                            <form onSubmit={postNews} style={s.newsForm}>
                                <input
                                    placeholder="Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    style={s.input}
                                />
                                <textarea
                                    placeholder="Content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    style={s.textarea}
                                />
                                <div style={{textAlign: "right"}}>
                                    <button type="submit" style={s.primaryBtn}>
                                        Post
                                    </button>
                                </div>
                            </form>
                        )}

                        {news.length === 0 && <div style={s.card}>No news yet.</div>}

                        {news.map((n) => (
                            <div key={n.id} style={s.card}>
                                <div style={s.cardHead}>
                                    <strong style={{fontSize: 16}}>{n.title}</strong>
                                    {canPostNews && (
                                        <button onClick={() => deleteNews(n.id)} style={s.dangerBtn}>
                                            Delete
                                        </button>
                                    )}
                                </div>
                                <div style={{whiteSpace: "pre-wrap", lineHeight: 1.5}}>{n.content}</div>
                                <div style={s.meta}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "events" && (
                    <div>
                        {canCreateEvent && (
                            <div style={{ display: "flex", justifyContent: "flex-end", padding:"10px"}}>
                                <button
                                    style={{color:"#ffffe3"}}
                                    className="dbutton"
                                    onClick={() => setShowCreateEvent(true)}
                                >
                                    + Create Event
                                </button>
                            </div>
                        )}

                        <EventTable
                            events={events}
                            showClub={false}
                            isPrivileged={isAdmin || isLeader}
                            onEdit={setEditingEvent}
                            onDelete={deleteEvent}
                        />

                        {editingEvent && (
                            <EditEventModal
                                event={editingEvent}
                                clubs={[club]}          // or full clubs list if you prefer
                                onSave={saveEvent}
                                onClose={() => setEditingEvent(null)}
                            />
                        )}


                    </div>
                )}

                {showCreateEvent && (
                    <div className="events-controls">
                        <div>
                            <h3>Create Event for {club.name}</h3>

                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();

                                    const payload = {
                                        title: e.target.title.value.trim(),
                                        content: e.target.content.value.trim(),
                                        location: e.target.location.value.trim(),
                                        startAt: e.target.startAt.value,
                                        endAt: e.target.endAt.value || null,
                                        clubId: clubId,
                                        visibility: "CLUB_MEMBERS",
                                        tags: e.target.tags.value
                                            ? e.target.tags.value.split(",").map(t => t.trim()).filter(Boolean)
                                            : []
                                    };

                                    try {
                                        const res = await apiFetch(
                                            `/api/events?requesterEmail=${encodeURIComponent(user.email)}`,
                                            {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify(payload),
                                            }
                                        );

                                        const body = await res.json();
                                        if (!res.ok) {
                                            alert(body.message || "Create failed");
                                            return;
                                        }

                                        // prepend newly created event
                                        setEvents(prev => [body.event, ...prev]);
                                        setShowCreateEvent(false);
                                    } catch {
                                        alert("Create failed");
                                    }
                                }}
                                style={{ display: "grid", gap: 10 }}
                            >
                                <input
                                    name="title"
                                    placeholder="Event title"
                                    required
                                />

                                <textarea
                                    name="content"
                                    placeholder="Description"
                                    rows={4}
                                />

                                <input
                                    name="location"
                                    placeholder="Location"
                                />

                                <input
                                    type="datetime-local"
                                    name="startAt"
                                    required
                                />

                                <input
                                    type="datetime-local"
                                    name="endAt"
                                />

                                <input
                                    name="tags"
                                    placeholder="Tags (comma separated)"
                                />

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => setShowCreateEvent(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}



                {activeTab === "members" && (
                    <div style={{margin: "15px"}}>
                        {/* Members & Pending */}
                        <div>
                            <div style={s.sectionHeader}>
                                <h3 style={s.h3}>Members</h3>
                            </div>

                            <div style={s.card}>
                                <ul style={s.list}>
                                    {sortedMembers.map((m) => {
                                        const isThisLeader = m.role === "LEADER";
                                        const isThisCoLeader = m.role === "CO_LEADER";
                                        const isThisMember = !isThisLeader && !isThisCoLeader;
                                        const isSelf = user && m.userId === user.id;
                                        const menuOpen = openMember === m.userId;

                                        const badge = isThisLeader ? (
                                            <span style={s.badgeLeader}>LEADER</span>
                                        ) : isThisCoLeader ? (
                                            <span style={s.badgeCoLeader}>CO-LEADER</span>
                                        ) : (
                                            <span style={s.badge}>MEMBER</span>
                                        );

                                        // Permissions vs this target
                                        const canKickThisUser =
                                            isAdmin || (isLeader && !isThisLeader) || (isCoLeader && isThisMember);

                                        const canPromoteToCoLeader = (isLeader || isAdmin) && isThisMember;

                                        // Admin can demote CO_LEADER; Leader can demote CO_LEADER
                                        const canDemoteToMember =
                                            (isLeader && isThisCoLeader) || (isAdmin && !isSelf && isThisCoLeader);


                                        return (
                                            <li key={m.id} style={{...s.listItem, position: "relative"}}>
                    <span
                        onClick={() => setOpenMember(menuOpen ? null : m.userId)}
                        style={{cursor: canSeeActionMenu ? "pointer" : "default"}}
                    >
                      {userLabel(m.userId)}
                    </span>

                                                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                                    {badge}
                                                    {canSeeActionMenu && !isSelf && (
                                                        <button
                                                            onClick={() => setOpenMember(menuOpen ? null : m.userId)}
                                                            style={s.primaryBtnSm}
                                                            title="Manage member"
                                                        >
                                                            ⋮
                                                        </button>
                                                    )}
                                                </div>

                                                {canSeeActionMenu && !isSelf && menuOpen && (
                                                    <div style={s.menu}>
                                                        {/* Admin: set sole LEADER */}
                                                        {isAdmin && !isThisLeader && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeLeader(m.userId)}
                                                            >
                                                                Make Leader (Admin)
                                                            </button>
                                                        )}
                                                        {isAdmin && !isThisCoLeader && !isThisMember && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeCoLeader(m.userId)}
                                                            >
                                                                Demote to Co-leader
                                                            </button>
                                                        )}

                                                        {/* Leader/Admin: promote MEMBER -> CO_LEADER */}
                                                        {canPromoteToCoLeader && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeCoLeader(m.userId)}
                                                            >
                                                                Promote to Co-leader
                                                            </button>
                                                        )}

                                                        {/* Leader or Admin: CO_LEADER -> MEMBER */}
                                                        {canDemoteToMember && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeMember(m.userId)}
                                                            >
                                                                Demote to Member
                                                            </button>
                                                        )}

                                                        {/* Kick */}
                                                        {canKickThisUser && (
                                                            <button
                                                                style={{...s.menuItem, color: "#b00020"}}
                                                                onClick={() => kickMember(m.userId)}
                                                            >
                                                                Kick
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                    {sortedMembers.length === 0 && <li style={s.muted}>No members yet.</li>}
                                </ul>
                            </div>

                            {canApproveRequests && (
                                <>
                                    <div style={s.sectionHeader}>
                                        <h3 style={s.h3}>Pending Requests</h3>
                                    </div>
                                    <div style={s.card}>
                                        {pending.length === 0 && <div style={s.muted}>No pending requests.</div>}
                                        {pending.map((r) => (
                                            <div key={r.id} style={s.pendingRow}>
                                                <div>
                                                    <div style={{fontWeight: 600}}>{userLabel(r.userId)}</div>
                                                    <div style={s.meta}>Request ID: {r.id}</div>
                                                </div>
                                                <div style={s.actions}>
                                                    <button
                                                        onClick={() => decide(r.id, "approve")}
                                                        style={s.primaryBtnSm}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => decide(r.id, "reject")}
                                                        style={s.dangerBtnSm}
                                                    >
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
                )}
            </div>
        </div>
    );

}


/* ---- styles ---- */
const s = {

    backLink: {
        margin: "10px 20px",
        textDecoration: "none",
        border: "1px solid #ddd",
        padding: "6px 10px",
        borderRadius: 8,
        background: "#f8f8f8",
        color: "#333",
        display: "inline-block",
        marginBottom: 10,
    },

    card: {
        background: "#fff",

        border: "1px solid #e6e6e6",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        marginBottom: 12,
    },
    headerCard: {width: "100%", backgroundColor: "#605f5f", marginTop: 50},
    headerTop: {display: "flex", padding: "20", justifyContent: "space-between",},
    title: {margin: 0, fontSize: "24px", lineHeight: 1.2, color: "#FFFFE4", fontWeight: "700"},
    desc: {marginTop: 8, color: "#444", lineHeight: 1.6},

    grid: {display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start", margin: "15px"},
    sectionHeader: {display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0"},
    h3: {margin: "10px", color: "#FFFFE3"},

    newsForm: {
        ...cardLike(),
        display: "grid",
        gap: 10,
        marginBottom: 12,
    },

    input: {
        width: "90%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        outline: "none",
    },
    textarea: {
        width: "90%",
        minHeight: 110,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        outline: "none",
        resize: "vertical",
    },

    primaryBtn: button("#0b57d0", "#fff"),
    dangerBtn: button("#b00020", "#fff"),
    primaryBtnSm: button("#0b57d0", "#fff", true),
    dangerBtnSm: button("#b00020", "#fff", true),

    cardHead: {display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8},
    meta: {opacity: 0.7, fontSize: 12, marginTop: 6},

    list: {listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8},
    listItem: {
        padding: "5px 10px",
        border: "1px solid #eee",
        borderRadius: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    muted: {color: "#777"},

    badge: {
        background: "#eef2f7",
        color: "#374151",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
    },
    badgeLeader: {
        background: "#fde68a",
        color: "#7c4a00",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
    },
    badgeCoLeader: {
        background: "#dbeafe",
        color: "#1e40af",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
    },

    pendingRow: {
        border: "1px solid #eee",
        borderRadius: 10,
        padding: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    actions: {display: "flex", gap: 8},

    // tiny absolute dropdown menu
    menu: {
        position: "absolute",
        right: 10,
        top: "100%",
        marginTop: 6,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        padding: 8,
        display: "grid",
        gap: 6,
        zIndex: 5,
        minWidth: 180,
    },
    menuItem: {
        background: "transparent",
        border: "none",
        textAlign: "left",
        padding: "6px 8px",
        borderRadius: 8,
        cursor: "pointer",
    },
};

// style helpers
function button(bg, fg, small = false) {
    return {
        background: bg,
        color: fg,
        border: "none",
        borderRadius: 10,
        padding: small ? "6px 10px" : "8px 12px",
        cursor: "pointer",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    };
}

function cardLike() {
    return {
        background: "#fff",
        border: "1px solid #e6e6e6",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    };
}
