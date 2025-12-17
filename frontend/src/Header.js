import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";

const Header = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const { user, login, logout, signup } = useContext(AuthContext);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ email: "", password: "", username: "" });
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState("");

    const isAdmin = !!user && String(user.role).toUpperCase() === "ADMIN";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
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

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const showLogin = windowWidth > 800;
    const showNews = windowWidth > 700;
    const showEvents = windowWidth > 600;
    const showClubs = windowWidth > 500;
    const showThreads = windowWidth > 400;

    const openModal = () => {
        setError("");
        setForm({ email: "", password: "", username: "" });
        setIsSignup(false);
        setShowModal(true);
    };

    return (
        <header style={styles.header}>
            <div style={styles.container}>
                {/* Logo */}
                <a href="#/" style={styles.logo} >MyLogo</a>

                {/* Search Bar */}
                <input type="text" placeholder="Search..." style={styles.search} />

                {/* Navigation */}
                <nav style={styles.nav}>
                    {showThreads && (
                        <a
                            href={String(user?.role || '').toUpperCase() === 'ADMIN' ? "#/admin/threads" : "#/threads"}
                            style={styles.navLink}
                        >
                            Threads
                        </a>
                    )}
                    {showClubs && <a href={String(user?.role || '').toUpperCase() === 'ADMIN' ? "#/admin/clubs" : "#/clubs"}
                                     style={styles.navLink}>Clubs</a>}
                    {showEvents && <a href={String(user?.role || '').toUpperCase() === 'ADMIN' ? "#/admin/events" : "#/events"}
                                     style={styles.navLink}>Events</a>}
                    {showNews && <a href={String(user?.role || '').toUpperCase() === 'ADMIN' ? "#/admin/news" : "#/news"}
                                    style={styles.navLink}>News</a>}

                    {isAdmin && (
                        <a
                            href="#/admin/users"
                            style={{
                                marginLeft: 10,
                                textDecoration: "none",
                                border: "1px solid #ccc",
                                padding: "6px 10px",
                                borderRadius: 6,
                                background: "#f8f8f8",
                                color: "#333"
                            }}
                        >
                            Users
                        </a>
                    )}
                </nav>

                {/* User Buttons */}
                {user ? (
                    <button style={styles.logoutBtn} onClick={logout}>Logout</button>
                ) : (
                    showLogin && <button style={styles.loginBtn} onClick={openModal}>Login</button>
                )}

                {/* Modal */}
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
            </div>
        </header>
    );
};

const styles = {
    header: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#041E42",
        color: "white",
        zIndex: 1000,
    },
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
    },
    logo: { fontWeight: "bold",
        fontSize: "20px",
        color: "#D50032",
        textDecoration: "none",
        cursor: "pointer", },
    search: {
        backgroundColor: "#6f7680",
        flexGrow: 1,
        margin: "0 20px",
        padding: "5px 10px",
        fontSize: "1rem",
        borderRadius: "4px",
        border: "none",
        color: "white",
    },
    nav: { display: "flex", gap: "15px", whiteSpace: "nowrap" },
    navLink: {
        color: "white",
        textDecoration: "none",
        fontWeight: "300",
        padding: "5px 10px",
        borderRight: "1px solid gray",
    },
    loginBtn: {
        marginLeft: "20px",
        padding: "8px 15px",
        fontSize: "1rem",
        borderRadius: "4px",
        backgroundColor: "#D50032",
        color: "white",
        border: "none",
        cursor: "pointer",
    },
    logoutBtn: {
        marginLeft: "10px",
        padding: "8px 15px",
        fontSize: "1rem",
        borderRadius: "4px",
        backgroundColor: "#D50032",
        color: "white",
        border: "none",
        cursor: "pointer",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: { backgroundColor: "#fff", padding: "20px", borderRadius: "6px", width: "400px", maxWidth: "90%" },
    input: { width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" },
    submitBtn: { padding: "8px 12px", marginRight: "10px", backgroundColor: "#D50032", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
    cancelBtn: { padding: "8px 12px", backgroundColor: "#ccc", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer" },
};

export default Header;
