import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import SideNav from "./components/SideNav";
import GlobalSearch from "./GlobalSearch";
import { apiFetch } from "./api";
import "./styles/header.css";

const TEST_LOGINS = [
    { label: "Admin",      email: "admin1@uni.ac.uk",     password: "password" },
    { label: "Leader",     email: "ellag6@uni.ac.uk",      password: "password" },
    { label: "Co-Leader",  email: "isabellah3@uni.ac.uk",  password: "password" },
    { label: "Member",     email: "liama0@uni.ac.uk",      password: "password" },
];

const Header = () => {
    const { user, login, logout, signup } = useContext(AuthContext);
    const [navOpen, setNavOpen] = useState(false);

    const isAdmin = !!user && String(user.role).toUpperCase() === "ADMIN";

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ email: "", password: "", username: "" });
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState("");
    const [showTestLogins, setShowTestLogins] = useState(false);

    const surveyUrl = "https://forms.office.com/Pages/ResponsePage.aspx?id=sAafLmkWiUWHiRCgaTTcYS_VjBLWGjZNk_QHvbrz_V1UQldERUxDNUkwRk5JR1RFU1YxTVZYV0NWVS4u";

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

        return () => { alive = false; };
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
        setShowTestLogins(false);
        setShowModal(true);
    };

    const applyTestLogin = (entry) => {
        setForm(prev => ({ ...prev, email: entry.email, password: entry.password }));
        setShowTestLogins(false);
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
                    <a onClick={handleSurveyClick} className="survey-btn">Survey</a>
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
                                <span className="activity-badge">{unread}</span>
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

            {/* Login / Signup modal */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
                            {isSignup ? "Sign Up" : "Login"}
                        </h3>

                        {/* ── Test login hint ── */}
                        {!isSignup && (
                            <div style={styles.testLoginBox}>
                                <button
                                    type="button"
                                    style={styles.testLoginToggle}
                                    onClick={() => setShowTestLogins(v => !v)}
                                >
                                    <span style={styles.testLoginIcon}>🔑</span>
                                    Use a test login
                                    <span style={{ marginLeft: "auto", fontSize: "11px", opacity: 0.7 }}>
                                        {showTestLogins ? "▲" : "▼"}
                                    </span>
                                </button>

                                {showTestLogins && (
                                    <div style={styles.testLoginList}>
                                        <p style={styles.testLoginNote}>
                                            All accounts use password: <code style={styles.code}>password</code>
                                        </p>
                                        {TEST_LOGINS.map((entry) => (
                                            <button
                                                key={entry.email}
                                                type="button"
                                                style={styles.testLoginEntry}
                                                onClick={() => applyTestLogin(entry)}
                                            >
                                                <span style={styles.testLoginLabel}>{entry.label}</span>
                                                <span style={styles.testLoginEmail}>{entry.email}</span>
                                            </button>
                                        ))}
                                        <p style={styles.testLoginNote}>
                                            More accounts in <strong>UserLogins.pdf</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* ────────────────────── */}

                        {error && <p style={{ color: "red", margin: "8px 0" }}>{error}</p>}

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

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
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
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: "24px",
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
        boxSizing: "border-box",
    },
    submitBtn: {
        padding: "8px 12px",
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
    /* ── test login styles ── */
    testLoginBox: {
        border: "1px solid #e0e0e0",
        borderRadius: "6px",
        marginBottom: "16px",
        overflow: "hidden",
        backgroundColor: "#fafafa",
    },
    testLoginToggle: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 12px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
        color: "#333",
        textAlign: "left",
    },
    testLoginIcon: {
        fontSize: "15px",
    },
    testLoginList: {
        borderTop: "1px solid #e0e0e0",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    testLoginNote: {
        margin: "2px 0 6px",
        fontSize: "12px",
        color: "#666",
    },
    testLoginEntry: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 10px",
        borderRadius: "4px",
        border: "1px solid #e0e0e0",
        background: "#fff",
        cursor: "pointer",
        fontSize: "13px",
        transition: "background 0.15s",
        gap: "10px",
    },
    testLoginLabel: {
        fontWeight: "600",
        color: "#D50032",
        minWidth: "70px",
    },
    testLoginEmail: {
        color: "#555",
        fontSize: "12px",
        fontFamily: "monospace",
    },
    code: {
        background: "#eee",
        padding: "1px 5px",
        borderRadius: "3px",
        fontFamily: "monospace",
    },
};

export default Header;