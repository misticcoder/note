import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext"; // Make sure this is your AuthContext

const Header = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Use context safely
    const auth = useContext(AuthContext);

    if (!auth) {
        console.error("Authentication context is missing. Did you wrap your app in <Authentication.Provider>?");
        return null; // Prevent crash
    }

    const { user, logout } = auth;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Breakpoints for showing navigation items
    const showLogin = windowWidth > 800;
    const showTalks = windowWidth > 700;
    const showForms = windowWidth > 600;
    const showClubs = windowWidth > 500;
    const showEvents = windowWidth > 400;

    return (
        <header style={styles.header}>
            <div style={styles.container}>
                {/* Logo */}
                <div style={styles.logo}>MyLogo</div>

                {/* Search Bar */}
                <input type="text" placeholder="Search..." style={styles.search} />

                {/* Navigation */}
                <nav style={styles.nav}>
                    {showEvents && <a href="#events" style={styles.navLink}>Events</a>}
                    {showClubs && <a href="#clubs" style={styles.navLink}>Clubs</a>}
                    {showForms && <a href="#forms" style={styles.navLink}>Forms</a>}
                    {showTalks && <a href="#talks" style={styles.navLink}>Talks</a>}

                    {/* Admin-only link */}
                    {user?.role === "admin" && (
                        <a href="/admin" style={styles.navLink}>Admin Panel</a>
                    )}
                </nav>

                {/* Auth Section */}
                {user ? (
                    <div style={styles.userInfo}>
                        <span style={styles.username}>Hi, {user.username} ({user.role})</span>
                        {showLogin && (
                            <button onClick={logout} style={styles.logoutBtn}>Logout</button>
                        )}
                    </div>
                ) : (
                    showLogin && (
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={() => auth.login("GuestUser", "user")} style={styles.loginBtn}>Login as User</button>
                            <button onClick={() => auth.login("AdminUser", "admin")} style={styles.loginBtn}>Login as Admin</button>
                        </div>
                    )
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
        width: "100%", // full-width background
        backgroundColor: "#041E42",
        color: "white",
        boxSizing: "border-box",
        zIndex: 1000,
    },
    container: {
        maxWidth: "1200px", // same as body max width
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
    },
    logo: {
        fontWeight: "bold",
        fontSize: "1.5rem",
        marginRight: "20px",
    },
    search: {
        backgroundColor: "#6f7680",
        flexGrow: 1,
        marginLeft: "20px",
        marginRight: "20px",
        padding: "5px 10px",
        fontSize: "1rem",
        borderRadius: "4px",
        border: "none",
        color: "white",
    },
    nav: {
        display: "flex",
        gap: "15px",
        whiteSpace: "nowrap",
    },
    navLink: {
        color: "white",
        textDecoration: "none",
        fontWeight: "500",
        padding: "0 10px",
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
        textDecoration: "none",
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
    userInfo: {
        display: "flex",
        alignItems: "center",
    },
    username: {
        marginRight: "10px",
        fontWeight: "500",
    },
};

export default Header;
