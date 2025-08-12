import React, { useState, useEffect } from "react";

const Header = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Visibility breakpoints for nav & login
    const showLogin = windowWidth > 900;
    const showTalks = windowWidth > 850;
    const showForms = windowWidth > 800;
    const showClubs = windowWidth > 750;
    const showEvents = windowWidth > 700;

    return (
        <header style={styles.header}>
            <div style={styles.container}>
                <div style={styles.logo}>MyLogo</div>
                <input type="text" placeholder="Search..." style={styles.search} />
                <nav style={styles.nav}>
                    {showEvents && <a href="#events" style={styles.navLink}>Events</a>}
                    {showClubs && <a href="#clubs" style={styles.navLink}>Clubs</a>}
                    {showForms && <a href="#forms" style={styles.navLink}>Forms</a>}
                    {showTalks && <a href="#talks" style={styles.navLink}>Talks</a>}
                </nav>
                {showLogin && <button style={styles.loginBtn}>Log In</button>}
            </div>
        </header>
    );
};

const styles = {
    header: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%", // full width background
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
        padding: "5px 10px",
        fontSize: "1rem",
        borderRadius: "1px",
        border: "none",
    },
    nav: {
        display: "flex",
        gap: "15px",
        marginLeft: "20px",
        whiteSpace: "nowrap",
    },
    navLink: {
        color: "white",
        textDecoration: "none",
        fontWeight: "500",
        padding: "0 15px",
        borderRight: "1px solid gray",
    },
    loginBtn: {
        marginLeft: "20px",
        padding: "8px 15px",
        fontSize: "1rem",
        borderRadius: "4px",
        border: "none",
        cursor: "pointer",
    },
};

export default Header;
