import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext";
import EventTable from "../Events/EventTable";
import "../styles/profile.css";

export default function ProfilePage() {
    const { user, setUser } = useContext(AuthContext);


    const [profile, setProfile] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeTab, setActiveTab] = useState("overview")

    const [eventsView, setEventsView] = useState("upcoming")

    useEffect(() => {
        if (!user?.email) return;

        setLoading(true);

        Promise.all([
            fetch(`/api/me/profile?email=${encodeURIComponent(user.email)}`)
                .then(r => r.ok ? r.json() : Promise.reject()),
            fetch(`/api/me/events?email=${encodeURIComponent(user.email)}`)
                .then(r => r.ok ? r.json() : Promise.reject())
        ])
            .then(([profileData, eventsData]) => {
                setProfile(profileData);
                setEvents(eventsData);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load profile");
                setLoading(false);
            });
    }, [user]);

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

            </div>

            {/* Tab Content */}
            <div className="profile-tab-content">
                {activeTab === "overview" && (
                    <OverviewTab profile={profile} />
                )}

                {activeTab === "events" && (
                    <EventsTab
                        events={events}
                        eventsView={eventsView}
                        setEventsView={setEventsView}
                    />
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


function OverviewTab({ profile }) {
    return (
        <div className="overview-tab">

            <div className="overview-section">
                <h2>{profile.displayName || profile.username}</h2>
                <div className="muted">@{profile.username}</div>
                <div className="role-badge">{profile.role}</div>

                {profile.bio && (
                    <p className="profile-bio">{profile.bio}</p>
                )}
            </div>

            <div className="overview-stats">
                <div className="stat-card">
                    <strong>{profile.eventsJoined}</strong>
                    <span>Events Joined</span>
                </div>

                <div className="stat-card">
                    <strong>{profile.participationScore}</strong>
                    <span>Participation</span>
                </div>
            </div>

            <div className="overview-section muted">
                Recent activity coming soon
            </div>
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