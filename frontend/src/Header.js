import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import SideNav from "./components/SideNav";
import GlobalSearch from "./GlobalSearch";
import { apiFetch } from "./api";
import "./styles/header.css";

const Header = () => {
    const { user, login, logout, signup } = useContext(AuthContext);
    const [navOpen, setNavOpen] = useState(false);

    const isAdmin = !!user && String(user.role).toUpperCase() === "ADMIN";

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ email: "", password: "", username: "" });
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState("");

    const surveyUrl = "https://forms.gle/YOUR_FORM_LINK";

    const handleSurveyClick = () => {
        const confirmed = window.confirm(
            "You are about to open the usability survey in a new tab.\n\nContinue?"
        );

        if (confirmed) {
            window.open(surveyUrl, "_blank", "noopener,noreferrer");
        }
    };

    /* ─────────────────────────────
       🔔 Activity unread count
    ───────────────────────────── */

    const [unread, setUnread] = useState(0);

    useEffect(() => {
        let alive = true;

        if (!user?.email) {
            setUnread(0);
            return;
        }

        apiFetch("/api/me/activity/unread-count", {
            headers: { "X-User-Email": user.email }
        })
            .then(r => r.ok ? r.json() : 0)
            .then(count => {
                if (alive) setUnread(Number(count) || 0);
            })
            .catch(() => {
                if (alive) setUnread(0);
            });

        return () => {
            alive = false;
        };
    }, [user]);

    /* ───────────────────────────── */

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (isSignup) {
            const result = await signup(form.email, form.password, form.username);
            if (!result.success) setError(result.message);
            else setShowModal(false);
        } else {
            const result = await login(form.email, form.password);
            if (!result.success) {
                if (result.newUser) setIsSignup(true);
                else setError(result.message);
            } else {
                setShowModal(false);
            }
        }
    };

    const openModal = () => {
        setError("");
        setForm({ email: "", password: "", username: "" });
        setIsSignup(false);
        setShowModal(true);
    };

    return (
        <header className="header">
            <div className="header-inner">

                {/* Mobile menu + logo */}
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        className="menu-btn"
                        onClick={() => setNavOpen(true)}
                        aria-label="Open menu"
                    >
                        ☰
                    </button>

                    <SideNav open={navOpen} onClose={() => setNavOpen(false)} />

                    <a href="#/home" className="logo">InfCom</a>
                </div>

                {/* Search */}
                <div className="header-search">
                    <GlobalSearch />
                </div>

                {/* Main nav */}
                <nav className="nav">
                    <a href="#/threads">Threads</a>
                    <a href="#/clubs">Clubs</a>
                    <a href="#/events">Events</a>
                    <a href="#/usability-tasks">Tasks</a>
                    <a onClick={handleSurveyClick}
                       className="survey-btn"
                    >
                        Survey
                    </a>
                    {isAdmin && <a href="#/admin/users">Users</a>}
                </nav>

                {/* User actions */}
                {user ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>

                        {/* 🔔 Activity */}
                        <a
                            href="#/profile?tab=activity"
                            className="activity-btn"
                            title="Activity"
                        >
                            🔔
                            {unread > 0 && (
                                <span className="activity-badge">
                                    {unread}
                                </span>
                            )}
                        </a>

                        {/* Profile */}
                        <a href="#/profile" className="badge">
                            {user.username}
                        </a>

                        {/* Logout */}
                        <button className="Btn" onClick={logout}>
                            <div className="sign">
                                <svg viewBox="0 0 512 512">
                                    <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9z" />
                                </svg>
                            </div>
                            <div className="text">Logout</div>
                        </button>
                    </div>
                ) : (
                    <button className="login-button" onClick={openModal}>
                        Login
                    </button>
                )}
            </div>

            {/* Login modal */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3>{isSignup ? "Sign Up" : "Login"}</h3>
                        {error && <p style={{ color: "red" }}>{error}</p>}

                        <form onSubmit={handleSubmit}>
                            {isSignup && (
                                <input
                                    name="username"
                                    placeholder="Username"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                    style={styles.input}
                                />
                            )}
                            <input
                                name="email"
                                type="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                            <input
                                name="password"
                                type="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />

                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button type="submit" style={styles.submitBtn}>
                                    {isSignup ? "Sign Up" : "Login"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </header>
    );
};

const styles = {
    modalOverlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "6px",
        width: "400px",
        maxWidth: "90%",
    },
    input: {
        width: "100%",
        padding: "8px",
        marginBottom: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
    },
    submitBtn: {
        padding: "8px 12px",
        marginRight: "10px",
        backgroundColor: "#D50032",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    cancelBtn: {
        padding: "8px 12px",
        backgroundColor: "#ccc",
        color: "#000",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
};

export default Header;
