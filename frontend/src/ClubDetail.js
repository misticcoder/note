import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import "./styles/clubs.css";
import ClubHeader from "./ClubHeader";
import EventTable from "./Events/EventTable";
import {apiFetch} from "./api";

import { useEventActions } from "./hooks/useEventActions";
import EditEventModal from "./Events/EditEventModal";

import "./styles/modal.css";
import ConfirmDialog from "./hooks/ConfirmDialog";



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

    const [newLinkType, setNewLinkType] = useState("WHATSAPP");
    const [newLinkUrl, setNewLinkUrl] = useState("");

    const [editingLink, setEditingLink] = useState(null);

    // 🔔 Supervisor-related state
    const [selectedSupervisor, setSelectedSupervisor] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportMessage, setReportMessage] = useState("");

    const [confirmState, setConfirmState] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
    });



    const [createForm, setCreateForm] = useState({
        title: "",
        content: "",
        location: "",
        startAt: "",
        endAt: "",
        tags: ""
    });


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

    // Add spinner animation styles
    useEffect(() => {
        const styleId = "club-detail-spinner-styles";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

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
        !!user && members.some((m) => m.user?.id === user.id && m.role === "CO_LEADER");
    const isLeader =
        !!user && members.some((m) => m.user?.id === user.id && m.role === "LEADER");




    // High-level capability flags
    const canManageEvents = isAdmin || isLeader || isCoLeader;
    const canManageLinks = isAdmin || isLeader || isCoLeader;
    const canSeeActionMenu = !!user && (isAdmin || isLeader || isCoLeader);

    const canPostNews = isAdmin || isLeader || isCoLeader; // co-leaders can post
    const canApproveRequests = isAdmin || isLeader; // pending requests only for admin/leader

    // derive membership from both sources (status + members list)
    const isMemberFromList = !!user && members.some((m) => m.user?.id === user.id);
    const effectiveIsMember = myStatus.isMember || isMemberFromList;

    const canCreateEvent = isAdmin || isLeader || isCoLeader;
    const [showCreateEvent, setShowCreateEvent] = useState(false);

    const linkMeta = {
        WHATSAPP: {
            icon: "fa-whatsapp",
            className: "social-whatsapp",
            label: "WhatsApp"
        },
        DISCORD: {
            icon: "fa-comments",
            className: "social-discord",
            label: "Discord"
        },
        INSTAGRAM: {
            icon: "fa-instagram",
            className: "social-instagram",
            label: "Instagram"
        },
        TELEGRAM: {
            icon: "fa-paper-plane",
            className: "social-telegram",
            label: "Telegram"
        },
        WEBSITE: {
            icon: "fa-globe",
            className: "social-website",
            label: "Website"
        }
    };


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
        setPending((prev) => prev.filter((p) => p.id !== myStatus.requestId && p.user?.id !== user.id));
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
        setMembers(prev => prev.filter((m) => m.user?.id !== user.id));

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
                    if (m.user?.id === targetUserId) {
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
                prev.map((m) => (m.user?.id === targetUserId ? { ...m, role: "CO_LEADER" } : m))
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
                prev.map((m) => (m.user?.id === targetUserId ? { ...m, role: "MEMBER" } : m))
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

            setMembers((prev) => prev.filter((m) => m.user?.id !== targetUserId));
            setOpenMember(null);
        } catch {
            alert("Failed to remove member");
        }
    };

    // 🔔 Supervisor Management Functions

    const assignSupervisor = async () => {
        if (!selectedSupervisor) return;

        const res = await apiFetch(
            `/api/clubs/${clubId}/supervisor?requesterEmail=${encodeURIComponent(user.email)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: Number(selectedSupervisor) })
            }
        );

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Failed to assign supervisor");
            return;
        }

        // Reload club data to get updated supervisor
        const updatedClub = await apiFetch(`/api/clubs/${clubId}`).then(r => r.json());
        setClub(updatedClub);
        setSelectedSupervisor(null);
    };

    const removeSupervisor = async () => {
        if (!window.confirm("Remove supervisor from this club?")) return;

        const res = await apiFetch(
            `/api/clubs/${clubId}/supervisor?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "DELETE" }
        );

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Failed to remove supervisor");
            return;
        }

        // Reload club data
        const updatedClub = await apiFetch(`/api/clubs/${clubId}`).then(r => r.json());
        setClub(updatedClub);
    };

    const submitReport = async (e) => {
        e.preventDefault();

        if (!reportMessage.trim()) return;

        const res = await apiFetch(
            `/api/clubs/${clubId}/report?requesterEmail=${encodeURIComponent(user.email)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: reportMessage.trim() })
            }
        );

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(body.message || "Failed to send report");
            return;
        }

        alert("Report sent successfully to supervisor");
        setShowReportModal(false);
        setReportMessage("");
    };

    if (!clubId)
        return (
            <div className={"page"}>
                <div className={"container"}>
                    <a href="#/clubs" style={s.backLink}>
                        ← Back
                    </a>
                </div>
            </div>
        );
    if (!club)
        return (
            <div className={"page"}>
                <div className={"container"}>
                    <div style={s.loadingContainer}>
                        <div style={s.loadingSpinner}></div>
                        <p style={s.loadingText}>Loading club details...</p>
                    </div>
                </div>
            </div>
        );

    const userLabel = (uid) => {
        if (!uid) return "Unknown User";  // Add this check
        const u = userMap.get(uid);
        if (!u) return `User #${uid}`;
        return `${u.username} (${u.email})`;
    };

    const leaderNames = sortedMembers
        .filter((m) => m.role === "LEADER")
        .map((m) => userLabel(m.user?.id));

    const addLink = async (e) => {
        e.preventDefault();

        if (!newLinkUrl.startsWith("https://")) {
            alert("Link must start with https://");
            return;
        }

        const res = await apiFetch(
            `/api/clubs/${clubId}/links?requesterEmail=${encodeURIComponent(user.email)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: newLinkType,
                    url: newLinkUrl
                })
            }
        );

        const body = await res.json().catch(() => null);
        if (!res.ok) {
            alert(body?.message || "Failed to add link");
            return;
        }

        // ✅ update club.links locally
        setClub(prev => ({
            ...prev,
            links: [...(prev.links || []), body]
        }));

        setNewLinkUrl("");
    };

    const deleteLink = async (linkId) => {
        const res = await apiFetch(
            `/api/clubs/links/${linkId}?requesterEmail=${encodeURIComponent(user.email)}`,
            { method: "DELETE" }
        );

        if (!res.ok) {
            alert("Failed to delete link");
            return;
        }

        setClub(prev => ({
            ...prev,
            links: prev.links.filter(l => l.id !== linkId)
        }));
    };

    const saveEditedLink = async (e) => {
        e.preventDefault();

        const { type, url, _original } = editingLink;

        if (!url.startsWith("https://")) {
            alert("Link must start with https://");
            return;
        }

        const typeChanged = type !== _original.type;
        const urlChanged = url !== _original.url;

        if (!typeChanged && !urlChanged) {
            setEditingLink(null);
            return;
        }

        setConfirmState({
            open: true,
            title: "Confirm link update",
            message: typeChanged
                ? "You are changing the platform type for this link. Are you sure?"
                : "Save changes to this link?",
            onConfirm: async () => {
                try {
                    const res = await apiFetch(
                        `/api/clubs/links/${editingLink.id}?requesterEmail=${encodeURIComponent(user.email)}`,
                        {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type, url }),
                        }
                    );

                    const body = await res.json().catch(() => null);
                    if (!res.ok) {
                        alert(body?.message || "Failed to update link");
                        return;
                    }

                    setClub(prev => ({
                        ...prev,
                        links: prev.links.map(l =>
                            l.id === body.id ? body : l
                        )
                    }));

                    setEditingLink(null);
                } finally {
                    setConfirmState({ open: false });
                }
            }
        });
    };

    const cancelEditLink = () => {
        const { type, url, _original } = editingLink;

        const dirty =
            type !== _original.type ||
            url !== _original.url;

        if (!dirty) {
            setEditingLink(null);
            return;
        }

        setConfirmState({
            open: true,
            title: "Discard changes?",
            message: "You have unsaved changes. Do you want to discard them?",
            onConfirm: () => {
                setEditingLink(null);
                setConfirmState({ open: false });
            }
        });
    };




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
                                <h3 style={s.h3}>Club Announcements</h3>
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

                            {news.length === 0 && <div style={s.card}>No Announcements yet.</div>}

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
                            {/* 🔔 Report to Supervisor (visible to members when supervisor exists) */}
                            {effectiveIsMember && club.supervisor && (
                                <div>
                                    <div style={s.sectionHeader}>
                                        <h3 style={s.h3}>Report Issue</h3>
                                    </div>
                                    <div style={s.card}>
                                        <p style={s.muted}>
                                            Have a concern? Report it to the club supervisor.
                                        </p>
                                        <button
                                            onClick={() => setShowReportModal(true)}
                                            style={s.primaryBtn}
                                        >
                                            Report to Supervisor
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Club Links */}
                            <div>
                                <div style={s.sectionHeader}>
                                    <h3 style={s.h3}>Join & Socials</h3>
                                </div>

                                <div style={s.card}>
                                    {(!club.links || club.links.length === 0) && (
                                        <div style={s.muted}>No external links provided.</div>
                                    )}

                                    <ul
                                        style={{
                                            listStyle: "none",
                                            padding: 0,
                                            margin: 0,
                                            display: "grid",
                                            gap: 10
                                        }}
                                    >
                                        {(club.links || []).map(link => {
                                            const isEditing = editingLink?.id === link.id;
                                            const meta = linkMeta[link.type] || linkMeta.WEBSITE;

                                            return (
                                                <li
                                                    key={link.id}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        gap: 12
                                                    }}
                                                >

                                                    {!isEditing ? (
                                                        <>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                                <a
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`social-icon ${meta.className}`}
                                                                    title={meta.label}
                                                                    aria-label={meta.label}
                                                                >
                                                                    <i className={`fa ${meta.icon}`} />
                                                                </a>

                                                                <span style={{ fontWeight: 600, color: "black" }}>{meta.label}</span>
                                                            </div>

                                                            {canManageLinks && (
                                                                <button
                                                                    onClick={() => setEditingLink({
                                                                        ...link,
                                                                        _original: { type: link.type, url: link.url }
                                                                    })}
                                                                    style={s.primaryBtnSm}
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                        </>

                                                    ) : (
                                                        <form
                                                            onSubmit={saveEditedLink}
                                                            style={{
                                                                display: "flex",
                                                                gap: 8,
                                                                width: "100%",
                                                                alignItems: "center"
                                                            }}
                                                        >
                                                            <select
                                                                value={editingLink.type}
                                                                onChange={e =>
                                                                    setEditingLink(l => ({
                                                                        ...l,
                                                                        type: e.target.value
                                                                    }))
                                                                }
                                                            >
                                                                <option value="WHATSAPP">WhatsApp</option>
                                                                <option value="DISCORD">Discord</option>
                                                                <option value="INSTAGRAM">Instagram</option>
                                                                <option value="TELEGRAM">Telegram</option>
                                                                <option value="WEBSITE">Website</option>
                                                            </select>

                                                            <input
                                                                type="url"
                                                                value={editingLink.url}
                                                                onChange={e =>
                                                                    setEditingLink(l => ({
                                                                        ...l,
                                                                        url: e.target.value
                                                                    }))
                                                                }
                                                                required
                                                                style={{flex: 1}}
                                                            />

                                                            <button type="submit" style={s.primaryBtnSm}>
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEditLink}
                                                                style={s.dangerBtnSm}
                                                            >
                                                                Cancel
                                                            </button>

                                                        </form>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>


                                    {canManageLinks && (
                                        <form onSubmit={addLink} style={{marginTop: 10, display: "flex", gap: 6}}>
                                            <select
                                                value={newLinkType}
                                                onChange={e => setNewLinkType(e.target.value)}
                                            >
                                                <option value="WHATSAPP">WhatsApp</option>
                                                <option value="DISCORD">Discord</option>
                                                <option value="INSTAGRAM">Instagram</option>
                                                <option value="TELEGRAM">Telegram</option>
                                                <option value="WEBSITE">Website</option>
                                            </select>

                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                value={newLinkUrl}
                                                onChange={e => setNewLinkUrl(e.target.value)}
                                                required
                                                style={{flex: 1}}
                                            />

                                            <button type="submit" style={s.primaryBtnSm}>
                                                Add
                                            </button>
                                        </form>
                                    )}
                                </div>
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
                                                    <div style={{fontWeight: 600}}>{userLabel(r.userId || r.user?.id)}</div>
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

                            <div style={s.sectionHeader}>
                                <h3 style={s.h3}>Members</h3>
                            </div>

                            <div style={s.card}>
                                <ul style={s.list}>
                                    {sortedMembers.map((m) => {
                                        const isThisLeader = m.role === "LEADER";
                                        const isThisCoLeader = m.role === "CO_LEADER";
                                        const isThisMember = !isThisLeader && !isThisCoLeader;
                                        const isSelf = user && m.user?.id === user.id;
                                        const menuOpen = openMember === m.user?.id;

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
                                                    onClick={() => setOpenMember(menuOpen ? null : m.user?.id)}
                                                    style={{cursor: canSeeActionMenu ? "pointer" : "default"}}
                                                >
                                                    {userLabel(m.user?.id)}
                                                </span>

                                                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                                    {badge}
                                                    {canSeeActionMenu && !isSelf && (
                                                        <button
                                                            onClick={() => setOpenMember(menuOpen ? null : m.user?.id)}
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
                                                                onClick={() => makeLeader(m.user?.id)}
                                                            >
                                                                Make Leader (Admin)
                                                            </button>
                                                        )}
                                                        {isAdmin && !isThisCoLeader && !isThisMember && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeCoLeader(m.user?.id)}
                                                            >
                                                                Demote to Co-leader
                                                            </button>
                                                        )}

                                                        {/* Leader/Admin: promote MEMBER -> CO_LEADER */}
                                                        {canPromoteToCoLeader && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeCoLeader(m.user?.id)}
                                                            >
                                                                Promote to Co-leader
                                                            </button>
                                                        )}

                                                        {/* Leader or Admin: CO_LEADER -> MEMBER */}
                                                        {canDemoteToMember && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeMember(m.user?.id)}
                                                            >
                                                                Demote to Member
                                                            </button>
                                                        )}

                                                        {/* Kick */}
                                                        {canKickThisUser && (
                                                            <button
                                                                style={{...s.menuItem, color: "#b00020"}}
                                                                onClick={() => kickMember(m.user?.id)}
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

                        </div>
                    </div>
                )}

                {activeTab === "news" && (
                    <div>
                        <div style={s.sectionHeader}>
                            <h3 style={s.h3}>Club Announcements</h3>
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

                        {news.length === 0 && <div style={s.card}>No Announcements yet.</div>}

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
                        {canManageEvents && (
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

                {/* 🔔 Admin Settings Tab */}
                {activeTab === "settings" && isAdmin && (
                    <div style={{margin: "15px"}}>
                        <div style={s.sectionHeader}>
                            <h3 style={s.h3}>Supervisor Management</h3>
                        </div>

                        <div style={s.card}>
                            {club.supervisor ? (
                                <div>
                                    <p style={{marginBottom: 12}}>
                                        <strong>Current Supervisor:</strong> {userLabel(club.supervisor.id)}
                                    </p>
                                    <button
                                        onClick={removeSupervisor}
                                        style={s.dangerBtn}
                                    >
                                        Remove Supervisor
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p style={{marginBottom: 12, color: "#666"}}>
                                        No supervisor assigned to this club.
                                    </p>
                                    <div style={{display: "flex", gap: 8, alignItems: "center"}}>
                                        <select
                                            value={selectedSupervisor || ""}
                                            onChange={(e) => setSelectedSupervisor(e.target.value)}
                                            style={{flex: 1, padding: "8px 12px", borderRadius: 8}}
                                        >
                                            <option value="">Select a user...</option>
                                            {users
                                                .filter(u => u.role === "ADMIN" || u.role === "USER")
                                                .map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.username} ({u.email})
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <button
                                            onClick={assignSupervisor}
                                            style={s.primaryBtn}
                                            disabled={!selectedSupervisor}
                                        >
                                            Assign
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showCreateEvent && canManageEvents && (
                    <div className="modal-backdrop" onClick={() => setShowCreateEvent(false)}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <h3>Create Event for {club.name}</h3>

                            <form
                                className="modal-form"
                                onSubmit={async (e) => {
                                    e.preventDefault();

                                    if (!createForm.title.trim() || !createForm.startAt) {
                                        alert("Title and start date are required");
                                        return;
                                    }

                                    const payload = {
                                        title: createForm.title.trim(),
                                        content: createForm.content.trim(),
                                        location: createForm.location.trim(),
                                        startAt: createForm.startAt,
                                        endAt: createForm.endAt || null,
                                        clubId: clubId,                 // 🔒 locked
                                        visibility: "CLUB_MEMBERS",     // 🔒 forced
                                        tags: createForm.tags
                                            ? createForm.tags
                                                .split(",")
                                                .map(t => t.trim())
                                                .filter(Boolean)
                                            : []
                                    };

                                    try {
                                        const res = await apiFetch(
                                            `/api/events?requesterEmail=${encodeURIComponent(user.email)}`,
                                            {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify(payload)
                                            }
                                        );

                                        const body = await res.json();
                                        if (!res.ok) {
                                            alert(body.message || "Create failed");
                                            return;
                                        }

                                        setEvents(prev => [body.event, ...prev]);
                                        setShowCreateEvent(false);
                                        setCreateForm({
                                            title: "",
                                            content: "",
                                            location: "",
                                            startAt: "",
                                            endAt: "",
                                            tags: ""
                                        });
                                    } catch {
                                        alert("Create failed");
                                    }
                                }}
                            >
                                {/* Club (locked, visible) */}
                                <input
                                    value={club.name}
                                    disabled
                                    title="Event will be created for this club"
                                />

                                <input
                                    placeholder="Event title"
                                    value={createForm.title}
                                    onChange={e =>
                                        setCreateForm(f => ({ ...f, title: e.target.value }))
                                    }
                                    required
                                />

                                <textarea
                                    placeholder="Description"
                                    rows={4}
                                    value={createForm.content}
                                    onChange={e =>
                                        setCreateForm(f => ({ ...f, content: e.target.value }))
                                    }
                                />

                                <input
                                    placeholder="Location"
                                    value={createForm.location}
                                    onChange={e =>
                                        setCreateForm(f => ({ ...f, location: e.target.value }))
                                    }
                                />

                                <input
                                    type="datetime-local"
                                    value={createForm.startAt}
                                    onChange={e =>
                                        setCreateForm(f => ({ ...f, startAt: e.target.value }))
                                    }
                                    required
                                />

                                <input
                                    type="datetime-local"
                                    value={createForm.endAt}
                                    onChange={e =>
                                        setCreateForm(f => ({ ...f, endAt: e.target.value }))
                                    }
                                />

                                <input
                                    placeholder="Tags (comma separated)"
                                    value={createForm.tags}
                                    onChange={e =>
                                        setCreateForm(f => ({ ...f, tags: e.target.value }))
                                    }
                                />

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="cancelBtn"
                                        onClick={() => setShowCreateEvent(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="saveBtn">
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
                                        const isSelf = user && m.user?.id === user.id;
                                        const menuOpen = openMember === m.user?.id;

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
                        onClick={() => setOpenMember(menuOpen ? null : m.user?.id)}
                        style={{cursor: canSeeActionMenu ? "pointer" : "default"}}
                    >
                      {userLabel(m.user?.id)}
                    </span>

                                                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                                    {badge}
                                                    {canSeeActionMenu && !isSelf && (
                                                        <button
                                                            onClick={() => setOpenMember(menuOpen ? null : m.user?.id)}
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
                                                                onClick={() => makeLeader(m.user?.id)}
                                                            >
                                                                Make Leader (Admin)
                                                            </button>
                                                        )}
                                                        {isAdmin && !isThisCoLeader && !isThisMember && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeCoLeader(m.user?.id)}
                                                            >
                                                                Demote to Co-leader
                                                            </button>
                                                        )}

                                                        {/* Leader/Admin: promote MEMBER -> CO_LEADER */}
                                                        {canPromoteToCoLeader && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeCoLeader(m.user?.id)}
                                                            >
                                                                Promote to Co-leader
                                                            </button>
                                                        )}

                                                        {/* Leader or Admin: CO_LEADER -> MEMBER */}
                                                        {canDemoteToMember && (
                                                            <button
                                                                style={s.menuItem}
                                                                onClick={() => makeMember(m.user?.id)}
                                                            >
                                                                Demote to Member
                                                            </button>
                                                        )}

                                                        {/* Kick */}
                                                        {canKickThisUser && (
                                                            <button
                                                                style={{...s.menuItem, color: "#b00020"}}
                                                                onClick={() => kickMember(m.user?.id)}
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
                                                    <div style={{fontWeight: 600}}>{userLabel(r.user?.id)}</div>
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

            {/* 🔔 Report Modal */}
            {showReportModal && (
                <div className="modal-backdrop" onClick={() => setShowReportModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Report Issue to Supervisor</h3>
                        <p style={s.muted}>
                            This will send a notification to {club.supervisor ? userLabel(club.supervisor.id) : "the supervisor"}
                        </p>

                        <form className="modal-form" onSubmit={submitReport}>
                            <textarea
                                placeholder="Describe the issue you want to report..."
                                value={reportMessage}
                                onChange={(e) => setReportMessage(e.target.value)}
                                required
                                rows={6}
                                style={s.textarea}
                            />

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancelBtn"
                                    onClick={() => setShowReportModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="saveBtn">
                                    Send Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState({ open: false })}
            />

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

    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        padding: "40px",
    },

    loadingSpinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #0b57d0",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },

    loadingText: {
        marginTop: "20px",
        color: "#666",
        fontSize: "16px",
    },

    card: {
        background: "#fff",
        color: "#000",
        border: "1px solid #e6e6e6",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        marginBottom: 12,
    },
    headerCard: {width: "100%", backgroundColor: "#605f5f"},
    headerTop: {display: "flex", justifyContent: "space-between",},
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