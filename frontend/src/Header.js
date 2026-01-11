import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import SideNav from "./components/SideNav";
import GlobalSearch from "./GlobalSearch";
import "./styles/header.css";

const Header = () => {
    const { user, login, logout, signup } = useContext(AuthContext);
    const [navOpen, setNavOpen] = useState(false);

    const isAdmin = !!user && String(user.role).toUpperCase() === "ADMIN";

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ email: "", password: "", username: "" });
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState("");

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
        <header className="header">
            <div className="header-inner">

                {/* Mobile menu */}
                <div style={{display: "flex", gap: "10px"}}>
                    <button
                        className="menu-btn"
                        onClick={() => setNavOpen(true)}
                        aria-label="Open menu"
                    >
                        ☰
                    </button>

                    <SideNav open={navOpen} onClose={() => setNavOpen(false)}/>

                    {/* Logo */}
                    <a href="#/home" className="logo">
                        InfCom
                    </a>
                </div>

                {/* Search */}
                <div className="header-search">
                    <GlobalSearch/>
                </div>

                <nav className="nav">
                    <a href="#/threads">Threads</a>
                    <a href="#/clubs">Clubs</a>
                    <a href="#/events">Events</a>
                    <a href="#/news">News</a>

                    {isAdmin && <a href="#/admin/users">Users</a>}

                    {user && (
                        <a
                            href="#/profile"
                            className="badge"
                            title="My Profile"
                        >
                            {user.username}
                        </a>
                    )}
                </nav>


                {user ? (
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}>


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
            </div>

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
        </header>
    );
};

const styles = {
    header: {
        position: "fixed",
        height: "200px",
        width: "100%",
        backgroundColor: "#041E42",
        color: "white",
        zIndex: 1000,
    },
    container: {
        maxWidth: "1200px",
        margin: " auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 30px",
    },
    logo: {
        fontWeight: "bold",
        fontSize: "50px",
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
