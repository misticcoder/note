import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../AuthContext";

import ClubOverview from "./ClubOverview";
import ClubMembers from "./ClubMembers";
import ClubNews from "./ClubNews";
import ClubHeader from "../ClubHeader";

export default function ClubMain({ clubId, activeTab }) {
    const { user } = useContext(AuthContext);

    const [club, setClub] = useState(null);
    const [news, setNews] = useState([]);
    const [members, setMembers] = useState([]);
    const [pending, setPending] = useState([]);
    const [users, setUsers] = useState([]);
    const [myStatus, setMyStatus] = useState({
        isMember: false,
        hasPending: false,
        requestId: null,
    });

    /* ---- roles ---- */
    const isAdmin = user?.role === "ADMIN";
    const isLeader = members.some(
        m => m.userId === user?.id && m.role === "LEADER"
    );
    const isCoLeader = members.some(
        m => m.userId === user?.id && m.role === "CO_LEADER"
    );

    const canPostNews = isAdmin || isLeader || isCoLeader;
    const canApproveRequests = isAdmin || isLeader;

    /* ---- user lookup ---- */
    const userMap = useMemo(() => {
        const map = new Map();
        users.forEach(u => map.set(u.id, u));
        return map;
    }, [users]);

    const userLabel = (id) => {
        const u = userMap.get(id);
        return u ? `${u.username} (${u.email})` : `User #${id}`;
    };

    /* ---- load data ---- */
    useEffect(() => {
        if (!clubId) return;

        Promise.all([
            fetch(`/api/clubs/${clubId}`).then(r => r.json()),
            fetch(`/api/clubs/${clubId}/news`).then(r => r.json()),
            fetch(`/api/clubs/${clubId}/members`).then(r => r.json()),
            fetch("/api/users").then(r => r.json()),
            user
                ? fetch(
                    `/api/clubs/${clubId}/status?requesterEmail=${encodeURIComponent(
                        user.email
                    )}`
                ).then(r => r.json())
                : Promise.resolve({ isMember: false, hasPending: false }),
        ]).then(([c, n, m, u, s]) => {
            setClub(c);
            setNews(n || []);
            setMembers(m || []);
            setUsers(u || []);
            setMyStatus(s);
        });
    }, [clubId, user?.email]);

    if (!club) {
        return <div style={{ padding: 20 }}>Loading…</div>;
    }

    /* ---- TAB SWITCH ---- */
    switch (activeTab) {
        case "members":
            return (
                <ClubMembers
                    members={members}
                    userLabel={userLabel}
                    canApprove={canApproveRequests}
                />
            );

        case "news":
            return (
                <ClubNews
                    news={news}
                    canPost={canPostNews}
                    setNews={setNews}
                />
            );

        case "overview":
        default:
            return (
                <ClubOverview
                    club={club}
                    news={news}
                    members={members}
                    pending={pending}
                    user={user}
                    userLabel={userLabel}
                    canPostNews={canPostNews}
                    canApproveRequests={canApproveRequests}
                    setNews={setNews}
                />
            );
    }
}
