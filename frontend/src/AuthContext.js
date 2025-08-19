import { createContext, useState, useContext, useEffect } from "react";

// AuthContext to manage login state
export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    // Restore login from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem("user");
            if (raw) setUser(JSON.parse(raw));
        } catch (e) {
            console.warn("Failed to parse saved user", e);
        }
    }, []);

    // Helper to save/clear localStorage
    const saveUser = (u) => {
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
    };
    const clearUser = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    const login = async (email, password) => {
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                const data = await res.json();
                // data.user comes from backend (id, email, username)
                saveUser(data.user);
                return { success: true };
            } else if (res.status === 404) {
                // user doesn't exist → trigger signup flow on UI
                return { success: false, newUser: true };
            } else if (res.status === 401) {
                return { success: false, message: "Invalid credentials" };
            } else {
                const data = await res.json().catch(() => ({}));
                return { success: false, message: data.message || "Login failed" };
            }
        } catch (err) {
            console.error(err);
            return { success: false, message: "Server error" };
        }
    };

    const logout = () => clearUser();

    const signup = async (email, password, username) => {
        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, username }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                return {
                    success: false,
                    message:
                        data.message ||
                        (res.status === 409 ? "Email/username already in use" : "Signup failed"),
                };
            }

            // auto-login after successful signup
            if (data.user) saveUser(data.user);
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false, message: err.message || "Signup failed" };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, signup }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
