import {useContext, useEffect, useMemo, useState} from "react";
import { AuthContext } from "../AuthContext";
import EventTable from "../Events/EventTable";
import "../styles/profile.css";
import ProfileClubsTable from "../Clubs/ProfileClubsTable";
import "../styles/events.css";
import "../styles/badges.css";
import "../styles/buttons.css"
import DashboardSection from "../components/DashboardSection";
import {apiFetch} from "../api";
import ActivityTab from "../Notifications/ActivityTab";



export default function ProfilePage() {
    const { user, setUser } = useContext(AuthContext);


    const [profile, setProfile] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [clubs, setClubs] = useState([]);
    const [recommendedEvents, setRecommendedEvents] = useState([]);



    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(window.location.hash.split("?")[1]);
        return params.get("tab") || "overview";
    });


    const [eventsView, setEventsView] = useState("attended");

    const tags = profile?.tags || [];
    const setTags = (newTags) =>
        setProfile(prev => (prev ? { ...prev, tags: newTags } : { tags: newTags }));


    useEffect(() => {
        if (!user?.email) return;

        setLoading(true);

        Promise.all([
            apiFetch(`/api/me/profile`, { headers: { "X-User-Email": user.email } }).then(r => r.json()),
            apiFetch(`/api/me/events`, { headers: { "X-User-Email": user.email } }).then(r => r.json()),
            apiFetch(`/api/me/clubs`, { headers: { "X-User-Email": user.email } }).then(r => r.json()),
            apiFetch(`/api/me/recommendations`, { headers: { "X-User-Email": user.email } }).then(r => r.json())
        ]).then(([profileData, eventsData, clubsData, recommended]) => {
            setProfile(profileData);
            setEvents(eventsData);
            setClubs(clubsData);
            setRecommendedEvents(recommended);
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
        const res = await apiFetch(`/api/me/profile`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-User-Email": user.email
            },
            body: JSON.stringify(updates)
        });

        if (!res.ok) throw new Error();

        const updated = await res.json();
        setProfile(updated);
        setActiveTab("overview");
    };


    return (
        <div className={"page"}>
            <div className={"container"}>
                <div className="profile-page">
                    <ProfileHeader profile={profile}/>

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
                            label="Activity"
                            active={activeTab === "activity"}
                            onClick={() => setActiveTab("activity")}
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
                                recommendedEvents={recommendedEvents}
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
                            <ProfileClubsTable clubs={clubs}/>
                        )}


                        {activeTab === "badges" && (
                            <div className="muted">Badges coming soon</div>
                        )}

                        {activeTab === "edit" && (
                            <EditProfileTab
                                profile={profile}
                                email={user.email}
                                tags={tags}
                                setTags={setTags}
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

                        {activeTab === "activity" && (
                            <ActivityTab />
                        )}


                    </div>
                </div>
            </div>
        </div>
    );
}

/* ───────────────────────────────────────── */

function ProfileHeader({profile}) {
    const initial = (profile?.displayName || profile?.username || "?")[0];


    return (
        <div className="profile-header">
            <div className={"profile-top"}>
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
                    <div>
                        <h1>Display Name: {profile.displayName || profile.username}</h1>


                        {profile.bio && <p className="profile-bio"> Bio: {profile.bio}</p>}

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
                        <br></br>
                        <div>
                            {profile.tags?.length > 0 && (
                                <div className="tag-editor">
                                    Interests:
                                    {profile.tags.map(t => (
                                        <span key={t} className="badge post-reference badge--gray" >{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                    <div>
                        <span className="user-badge">{profile.role}</span>
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
                         recommendedEvents,
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
            <div className={"overview-header"}>

                <h2 className={"title"}>Welcome back, {profile.displayName || profile.username}</h2>
                <div className="muted">@{profile.username}</div>


            </div>

            <div className={"title"}>
                {profile.bio && (
                    <p className="profile-bio">{profile.bio}</p>
                )}
            </div>

            {/* ───── Stats ───── */}
            <div>
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
            </div>

            {/* ───── Upcoming Events ───── */}
            <DashboardSection
                title="Upcoming Events"
                actionLabel="View all"
                onAction={onGoToEvents}
            >
                <EventTable
                    events={upcomingEvents}

                    showClub={true}
                />
            </DashboardSection>

            <DashboardSection
                title="Recommended Events"
                actionLabel="View all"
                onAction={onGoToEvents}
            >
                {recommendedEvents.length ? (
                    <EventTable
                        events={recommendedEvents.slice(0, 3)}
                        showClub={true}
                    />
                ) : (
                    <div className="muted">No recommendations yet</div>
                )}
            </DashboardSection>


            {/* ───── Clubs ───── */}
            <DashboardSection
                title="Your Clubs"
                actionLabel="View all"
                onAction={onGoToClubs}
            >
                <ClubsTab
                    clubs={clubs}
                />
            </DashboardSection>

            {/* ───── Actions ───── */}

            <DashboardSection
                title="Actions">
                <div className="overview-actions">
                    <button onClick={onEditProfile}
                            title={"Edit Profile"} className={"dbutton"}>Edit Profile</button>
                    <button title={"Browse Events"} onClick={onGoToEvents} className={"dbutton"}>Browse Events</button>
                    <button title={"Browse Clubs"} onClick={onGoToClubs} className={"dbutton"}>Discover Clubs</button>
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
    const attended = events.filter(e => e.status === "ATTENDED");
    const going = events.filter(e => e.status === "GOING");
    const maybe = events.filter(e => e.status === "MAYBE");
    const missed = events.filter(e => e.status === "MISSED");

    let list;
    switch (eventsView) {
        case "attended":
            list = attended;
            break;
        case "going":
            list = going;
            break;
        case "maybe":
            list = maybe;
            break;
        case "missed":
            list = missed;
            break;
        default:
            list = attended;
    }

    return (
        <div>
            <div className="events-subtabs">
                <button
                    className={`events-subtab ${eventsView === "attended" ? "active" : ""}`}
                    onClick={() => setEventsView("attended")}
                >
                    Attended ({attended.length})
                </button>

                <button
                    className={`events-subtab ${eventsView === "going" ? "active" : ""}`}
                    onClick={() => setEventsView("going")}
                >
                    Going ({going.length})
                </button>

                <button
                    className={`events-subtab ${eventsView === "maybe" ? "active" : ""}`}
                    onClick={() => setEventsView("maybe")}
                >
                    Maybe ({maybe.length})
                </button>

                <button
                    className={`events-subtab missed ${eventsView === "missed" ? "active" : ""}`}
                    onClick={() => setEventsView("missed")}
                >
                    Missed ({missed.length})
                </button>
            </div>

            {list.length ? (
                <EventTable events={list} showClub />
            ) : (
                <div className="muted" style={{ marginTop: 12 }}>
                    No events in this category.
                </div>
            )}
        </div>
    );
}



function EditProfileTab({ profile, email, onSave, onAvatarUpdated, tags, setTags }) {

    const [tagInput, setTagInput] = useState("");

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

            const res = await apiFetch(`/api/me/tags`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Email": email
                },
                body: JSON.stringify(tags)
            });

            if (!res.ok) throw new Error();

        } catch {
            setError("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };


    const addTag = () => {
        const value = tagInput.trim();
        if (!value) return;

        const normalised = value.toLowerCase();

        if (tags.map(t => t.toLowerCase()).includes(normalised)) return;

        setTags([...tags, value]);
        setTagInput("");
    };


    const removeTag = (tag) => {
        setTags(tags.filter(t => t !== tag));
    };


    return (
        <form className="edit-profile-form" onSubmit={submit}>
            {error && <div className="error">{error}</div>}

            <label>
                <h3 className={"title"}>Display Name</h3>
                <input
                    value={form.displayName}
                    onChange={e => setForm({...form, displayName: e.target.value})}
                />
            </label>

            <label>
                <h3 className={"title"}>Bio</h3>
                <textarea
                    rows={4}
                    value={form.bio}
                    onChange={e => setForm({...form, bio: e.target.value})}
                />
            </label>

            <label>
                <h3 className="title">Interests</h3>

                <div className="tag-editor">
                    {tags.map(t => (
                        <span key={t} className="tag-chip">
                {t}
                            <button type="button" onClick={() => removeTag(t)}>×</button>
            </span>
                    ))}
                </div>

                <div className="tag-input-row">
                    <input
                        value={tagInput}
                        placeholder="Add interest (e.g. Football)"
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <button type="button" onClick={addTag}>Add</button>
                </div>

                <div className="muted">
                    Used to personalise your event recommendations
                </div>
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

                        const res = await apiFetch(`/api/me/avatar`, {
                            method: "POST",
                            headers: {
                                "X-User-Email": email
                            },
                            body: formData
                        });


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

function ClubsTab({clubs}) {
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
                        <img src={c.logoUrl} alt={c.name}/>
                    ) : (
                        <div className="club-placeholder">
                            {c.name[0]}
                        </div>
                    )}
                    <strong className={"club-info"}>{c.name}</strong>
                    <span className="muted">{c.role}</span>

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
