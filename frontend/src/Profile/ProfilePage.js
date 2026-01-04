import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext";
import EventTable from "../Events/EventTable";
import "../styles/profile.css";

export default function ProfilePage() {
    const { user } = useContext(AuthContext);

    const [profile, setProfile] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    return (
        <div className="profile-page">
            <ProfileHeader profile={profile} />

            <div className="profile-section">
                <h2>My Events</h2>
                <EventTable events={events} showClub />
            </div>
        </div>
    );
}

/* ───────────────────────────────────────── */

function ProfileHeader({ profile }) {
    return (
        <div className="profile-header">
            <div className="profile-avatar">
                {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="avatar" />
                ) : (
                    <div className="avatar-placeholder">
                        {(profile.displayName || profile.username)[0]}
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
