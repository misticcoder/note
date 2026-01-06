import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import SideNav from "./components/SideNav";
import GlobalSearch from "./GlobalSearch";
import "./styles/header.css";

const Header = () => {
    const [navOpen, setNavOpen] = useState(false);
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

                <button
                    onClick={() => setNavOpen(true)}
                    title={"Quick Access Bar"}
                    style={{
                        marginRight:"5px",
                        background: "none",
                        border: "none",
                        color: "#fff",
                        fontSize: 20,
                        cursor: "pointer"
                    }}
                >
                    ☰
                </button>

                <SideNav open={navOpen} onClose={() => setNavOpen(false)}/>

                {/* Logo */}
                <a href="#/home" style={styles.logo}
                title={"Home"}>InfCom</a>

                {/* Search Bar */}
                <GlobalSearch />

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
                    {showClubs &&
                        <a href={String(user?.role || '').toUpperCase() === 'ADMIN' ? "#/admin/clubs" : "#/clubs"}
                           style={styles.navLink}>Clubs</a>}
                    {showEvents &&
                        <a href={String(user?.role || '').toUpperCase() === 'ADMIN' ? "#/admin/events" : "#/events"}
                           style={styles.navLink}>Events</a>}
                    {showNews &&
                        <a href={String(user?.role || '').toUpperCase() === 'ADMIN' ? "#/admin/news" : "#/news"}
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

                {user ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <a
                            href="#/profile"
                            style={{
                                color: "#FFFFE3",
                                textDecoration: "none",
                                fontWeight: 500,
                                padding: "6px 10px",
                                borderRadius: 4,
                                background: "rgba(255,255,255,0.15)"
                            }}
                            title="My Profile"
                        >
                            {user.username}
                        </a>

                        <button className="Btn" onClick={logout}>

                            <div className="sign">
                                <svg viewBox="0 0 512 512">
                                    <path
                                        d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
                                </svg>
                            </div>

                            <div className="text">Logout</div>
                        </button>
                    </div>
                ) : (
                    showLogin && <button className={"login-button"} onClick={openModal}>Login</button>
                )}


                {/* Modal */}
                {showModal && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <h3>{isSignup ? "Sign Up" : "Login"}</h3>
                            {error && <p style={{color: "red"}}>{error}</p>}
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
                                <div style={{display: "flex", justifyContent: "flex-end"}}>
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
        padding: "10px 30px",
    },
    logo: {
        fontWeight: "bold",
        fontSize: "20px",
        color: "#FFFFE3",
        textDecoration: "none",
        cursor: "pointer",
    },
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
