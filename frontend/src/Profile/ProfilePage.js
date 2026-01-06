import {useContext, useEffect, useMemo, useState} from "react";
import { AuthContext } from "../AuthContext";
import EventTable from "../Events/EventTable";
import "../styles/profile.css";
import ProfileClubsTable from "../Clubs/ProfileClubsTable";

import DashboardSection from "../components/DashboardSection";



export default function ProfilePage() {
    const { user, setUser } = useContext(AuthContext);


    const [profile, setProfile] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [clubs, setClubs] = useState([]);
    const [allEvents, setAllEvents] = useState([]);



    const [activeTab, setActiveTab] = useState("overview")

    const [eventsView, setEventsView] = useState("upcoming")



    useEffect(() => {
        if (!user?.email) return;

        setLoading(true);

        Promise.all([
            fetch(`/api/me/profile?email=${encodeURIComponent(user.email)}`).then(r => r.json()),
            fetch(`/api/me/events?email=${encodeURIComponent(user.email)}`).then(r => r.json()),
            fetch(`/api/me/clubs?email=${encodeURIComponent(user.email)}`).then(r => r.json()),
            fetch(`/api/events`).then(r => r.json())
        ])
            .then(([profileData, eventsData, clubsData, allEventsData]) => {
                setProfile(profileData);
                setEvents(eventsData);
                setClubs(clubsData);
                setAllEvents(allEventsData);
            })
            .catch(() => {
                setError("Failed to load profile");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [user]);


    const joinedEventIds = useMemo(
        () => new Set(events.map(e => e.id)),
        [events]
    );



    if (!user) {
        return <div className="profile-page">Please log in</div>;
    }

    if (loading) {
        return <div className="profile-page">Loading profile…</div>;
    }

    if (error) {
        return <div className="profile-page error">{error}</div>;
    }

    const saveProfile = async (updates) => {
        const res = await fetch(
            `/api/me/profile?email=${encodeURIComponent(user.email)}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            }
        );

        if (!res.ok) throw new Error();

        const updated = await res.json();
        setProfile(updated);
        setActiveTab("overview");
    };


    return (
        <div className="profile-page">
            <ProfileHeader profile={profile} />

            {/* Tabs */}
            <div className="profile-tabs">
                <TabButton
                    label="Overview"
                    active={activeTab === "overview"}
                    onClick={() => setActiveTab("overview")}
                />
                <TabButton
                    label="Events"
                    active={activeTab === "events"}
                    onClick={() => setActiveTab("events")}
                />
                <TabButton
                    label="Clubs"
                    active={activeTab === "clubs"}
                    onClick={() => setActiveTab("clubs")}
                />
                <TabButton
                    label="Badges"
                    active={activeTab === "badges"}
                    onClick={() => setActiveTab("badges")}
                />
                <TabButton
                    label="Edit Profile"
                    active={activeTab === "edit"}
                    onClick={() => setActiveTab("edit")}
                />

                {(profile.role === "ADMIN" || profile.role === "LEADER") && (
                    <TabButton
                        label="Dashboard"
                        active={activeTab === "dashboard"}
                        onClick={() => setActiveTab("dashboard")}
                    />
                )}


            </div>

            {/* Tab Content */}
            <div className="profile-tab-content">
                {activeTab === "overview" && (
                    <OverviewTab
                        profile={profile}
                        events={events}
                        clubs={clubs}
                        allEvents={allEvents}              // ✅ ADD
                        joinedEventIds={joinedEventIds}    // ✅ ADD
                        onGoToEvents={() => setActiveTab("events")}
                        onGoToClubs={() => setActiveTab("clubs")}
                        onEditProfile={() => setActiveTab("edit")}
                    />

                )}


                {activeTab === "events" && (
                    <EventsTab
                        events={events}
                        eventsView={eventsView}
                        setEventsView={setEventsView}
                    />
                )}

                {activeTab === "clubs" && (
                    <ProfileClubsTable clubs={clubs} />
                )}



                {activeTab === "badges" && (
                    <div className="muted">Badges coming soon</div>
                )}

                {activeTab === "edit" && (
                    <EditProfileTab
                        profile={profile}
                        email={user.email}
                        onSave={saveProfile}
                        onAvatarUpdated={(updated) => {
                            setProfile(updated);

                            setUser(prev => ({
                                ...prev,
                                avatarUrl: updated.avatarUrl,
                                displayName: updated.displayName,
                            }));
                        }}

                    />
                )}

                {activeTab === "dashboard" && (
                    <DashboardTab
                        role={profile.role}
                        onCreateEvent={() => setActiveTab("events")}
                        onCreateClub={() => alert("Create club modal later")}
                        onManageClubs={() => setActiveTab("clubs")}
                    />
                )}


            </div>
        </div>
    );
}

/* ───────────────────────────────────────── */

function ProfileHeader({ profile }) {
    const initial = (profile?.displayName || profile?.username || "?")[0];


    return (
        <div className="profile-header">
            <div className="profile-avatar">
                {profile?.avatarUrl ? (
                    <img
                        src={profile.avatarUrl}
                        alt="avatar"
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    <div className="avatar-placeholder">
                        {initial}
                    </div>
                )}
            </div>

            <div className="profile-info">
                <h1>{profile.displayName || profile.username}</h1>
                <p className="profile-role">{profile.role}</p>

                {profile.bio && <p className="profile-bio">{profile.bio}</p>}

                <div className="profile-stats">
                    <div>
                        <strong>{profile.eventsJoined}</strong>
                        <span>Events</span>
                    </div>
                    <div>
                        <strong>{profile.participationScore}</strong>
                        <span>Score</span>
                    </div>
                </div>
            </div>
        </div>
    );
}




function OverviewTab({
                         profile,
                         events,
                         clubs,
                         allEvents,
                         joinedEventIds,
                         onGoToEvents,
                         onGoToClubs,
                         onEditProfile
                     }) {

    const now = new Date();

    const upcomingEvents = events
        .filter(e => e?.startAt && new Date(e.startAt) >= now)
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
        .slice(0, 3);

    return (
        <div className="overview-tab">

            {/* ───── Identity ───── */}
            <DashboardSection>
                <h2>Welcome back, {profile.displayName || profile.username}</h2>
                <div className="muted">@{profile.username}</div>
                <span className="role-badge">{profile.role}</span>

                {profile.bio && (
                    <p className="profile-bio">{profile.bio}</p>
                )}
            </DashboardSection>

            {/* ───── Stats ───── */}
            <DashboardSection>
                <div className="overview-stats">
                    <div className="stat-card">
                        <strong>{profile.eventsJoined}</strong>
                        <span>Events Joined</span>
                    </div>

                    <div className="stat-card">
                        <strong>{profile.participationScore}</strong>
                        <span>Participation Score</span>
                    </div>

                    <div className="stat-card">
                        <strong>{clubs.length}</strong>
                        <span>Clubs</span>
                    </div>
                </div>
            </DashboardSection>

            {/* ───── Upcoming Events ───── */}
            <DashboardSection
                title="Upcoming Events"
                actionLabel="View all"
                onAction={onGoToEvents}
            >
                {upcomingEvents.length ? (
                    <ul className="overview-event-list">
                        {upcomingEvents.map(e => (
                            <li key={e.id}>
                                <strong>{e.title}</strong>
                                <div className="muted">
                                    {new Date(e.startAt).toLocaleString()}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="muted">No upcoming events</div>
                )}
            </DashboardSection>

            <RecommendedEvents
                allEvents={allEvents}
                joinedEventIds={joinedEventIds}
                clubs={clubs}
                profile={profile}
                onViewEvents={onGoToEvents}
            />





            {/* ───── Clubs ───── */}
            <DashboardSection
                title="Your Clubs"
                actionLabel="View all"
                onAction={onGoToClubs}
            >
                {clubs.length ? (
                    <div className="overview-clubs-preview">
                        {clubs.slice(0, 4).map(c => (
                            <div key={c.id} className="overview-club-chip">
                                {c.name}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="muted">You are not in any clubs</div>
                )}
            </DashboardSection>

            {/* ───── Actions ───── */}
            <DashboardSection>
                <div className="overview-actions">
                    <button onClick={onEditProfile}>Edit Profile</button>
                    <button onClick={onGoToEvents}>Browse Events</button>
                    <button onClick={onGoToClubs}>Discover Clubs</button>
                </div>
            </DashboardSection>

        </div>
    );
}




function TabButton({ label, active, onClick }) {
    return (
        <button
            className={`profile-tab ${active ? "active" : ""}`}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

function EventsTab({ events, eventsView, setEventsView }) {
    const now = new Date();

    const upcoming = events
        .filter(e => {
            if (!e?.startAt) return true; // treat missing date as upcoming
            return new Date(e.startAt) >= now;
        })
        .sort((a, b) => {
            const aa = a?.startAt ? new Date(a.startAt).getTime() : Number.MAX_SAFE_INTEGER;
            const bb = b?.startAt ? new Date(b.startAt).getTime() : Number.MAX_SAFE_INTEGER;
            return aa - bb;
        });

    const past = events
        .filter(e => e?.startAt && new Date(e.startAt) < now)
        .sort((a, b) => {
            const aa = a?.startAt ? new Date(a.startAt).getTime() : 0;
            const bb = b?.startAt ? new Date(b.startAt).getTime() : 0;
            return bb - aa; // most recent first
        });

    const list = eventsView === "upcoming" ? upcoming : past;

    return (
        <div>
            <div className="events-subtabs">
                <button
                    className={`events-subtab ${eventsView === "upcoming" ? "active" : ""}`}
                    onClick={() => setEventsView("upcoming")}
                >
                    Upcoming ({upcoming.length})
                </button>

                <button
                    className={`events-subtab ${eventsView === "past" ? "active" : ""}`}
                    onClick={() => setEventsView("past")}
                >
                    Past ({past.length})
                </button>
            </div>

            {list.length ? (
                <EventTable events={list} showClub />
            ) : (
                <div className="muted" style={{ marginTop: 12 }}>
                    No {eventsView === "upcoming" ? "upcoming" : "past"} events.
                </div>
            )}
        </div>
    );
}

function EditProfileTab({ profile, email, onSave, onAvatarUpdated }) {
    const [form, setForm] = useState({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            await onSave(form);
        } catch {
            setError("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="edit-profile-form" onSubmit={submit}>
            {error && <div className="error">{error}</div>}

            <label>
                <h3 className={"title"}>Display Name</h3>
                <input
                    value={form.displayName}
                    onChange={e => setForm({ ...form, displayName: e.target.value })}
                />
            </label>

            <label>
                <h3 className={"title"}>Bio</h3>
                <textarea
                    rows={4}
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                />
            </label>

            <label>
                <h3 className={"title"}>Change Avatar</h3>
                <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        const formData = new FormData();
                        formData.append("file", file);

                        const res = await fetch(
                            `/api/me/avatar?email=${encodeURIComponent(email)}`,
                            { method: "POST", body: formData }
                        );

                        if (!res.ok) {
                            alert("Avatar upload failed");
                            return;
                        }

                        const updated = await res.json();
                        onAvatarUpdated(updated);
                    }}
                />
            </label>

            <button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
            </button>
        </form>
    );
}

function ClubsTab({ clubs }) {
    if (!clubs.length) {
        return <div className="muted">You are not a member of any clubs yet.</div>;
    }

    return (
        <div className="profile-clubs">
            {clubs.map(c => (
                <a
                    key={c.id}
                    href={`#/clubs/${c.id}`}
                    className="profile-club-card"
                >
                    {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.name} />
                    ) : (
                        <div className="club-placeholder">
                            {c.name[0]}
                        </div>
                    )}

                    <div className="club-info">
                        <strong>{c.name}</strong>
                        <span className="muted">{c.role}</span>
                    </div>
                </a>
            ))}
        </div>
    );
}

function DashboardTab({
                          role,
                          onCreateEvent,
                          onCreateClub,
                          onManageClubs
                      }) {
    return (
        <div className="dashboard-tab">

            <h2>Dashboard</h2>
            <p className="muted">
                Manage events, clubs, and community activity
            </p>

            <div className="dashboard-grid">

                {/* EVENTS */}
                <DashboardCard
                    title="Events"
                    description="Create and manage events"
                    actions={[
                        { label: "Create Event", onClick: onCreateEvent }
                    ]}
                />

                {/* LEADER ONLY */}
                {role === "LEADER" && (
                    <DashboardCard
                        title="My Club"
                        description="Manage your club events"
                        actions={[
                            { label: "Post Event", onClick: onCreateEvent }
                        ]}
                    />
                )}

                {/* ADMIN ONLY */}
                {role === "ADMIN" && (
                    <>
                        <DashboardCard
                            title="Clubs"
                            description="Create and manage clubs"
                            actions={[
                                { label: "Create Club", onClick: onCreateClub },
                                { label: "Manage Clubs", onClick: onManageClubs }
                            ]}
                        />

                        <DashboardCard
                            title="Moderation"
                            description="Review content and activity"
                            actions={[
                                { label: "View Reports", onClick: () => alert("Later") }
                            ]}
                        />
                    </>
                )}
            </div>
        </div>
    );
}


function DashboardCard({ title, description, actions }) {
    return (
        <div className="dashboard-card">
            <h3>{title}</h3>
            <p className="muted">{description}</p>

            <div className="dashboard-actions">
                {actions.map((a, i) => (
                    <button key={i} onClick={a.onClick}>
                        {a.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function RecommendedEvents({
                               allEvents,
                               joinedEventIds,
                               clubs,
                               profile,
                               onViewEvents
                           }) {
    const now = new Date();
    const userClubIds = new Set(clubs.map(c => c.id));

    const recommended = allEvents
        .filter(e => e?.startAt && new Date(e.startAt) > now)
        .filter(e => !joinedEventIds.has(e.id))
        .map(e => {
            let score = 50;

            if (e.club && userClubIds.has(e.club.id)) score += 40;

            const daysAway =
                (new Date(e.startAt) - now) / (1000 * 60 * 60 * 24);
            if (daysAway <= 7) score += 20;

            if (profile.role === "ADMIN" || profile.role === "LEADER") {
                score += 10;
            }

            return { ...e, _score: score };
        })
        .sort((a, b) => b._score - a._score)
        .slice(0, 3);

    if (!recommended.length) return null;

    return (
        <div className="overview-section">
            <div className="overview-section-header">
                <h3>Recommended for You</h3>
                <button className="link-btn" onClick={onViewEvents}>
                    View all
                </button>
            </div>

            <ul className="overview-event-list">
                {recommended.map(e => (
                    <li key={e.id}>
                        <strong>{e.title}</strong>
                        <div className="muted">
                            {new Date(e.startAt).toLocaleString()}
                        </div>
                        <div className="recommend-reason">
                            {getRecommendationReason(e, userClubIds)}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}


function getRecommendationReason(event, userClubIds) {
    if (event.club && userClubIds.has(event.club.id)) {
        return "Because you're a member of this club";
    }

    const days =
        (new Date(event.startAt) - new Date()) / (1000 * 60 * 60 * 24);

    if (days <= 7) {
        return "Happening soon";
    }

    return "Popular upcoming event";
}
