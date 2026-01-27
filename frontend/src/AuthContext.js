import { createContext, useState, useEffect } from "react";
import { apiFetch } from "./api";

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
            const res = await apiFetch("/api/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                const data = await res.json();
                saveUser(data.user);
                return { success: true };
            }

            if (res.status === 404) {
                return { success: false, newUser: true };
            }

            if (res.status === 401) {
                return { success: false, message: "Invalid credentials" };
            }

            const data = await res.json().catch(() => ({}));
            return { success: false, message: data.message || "Login failed" };

        } catch (err) {
            console.error(err);
            return { success: false, message: "Server error" };
        }
    };

    const signup = async (email, password, username) => {
        try {
            const res = await apiFetch("/api/signup", {
                method: "POST",
                body: JSON.stringify({ email, password, username }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                return {
                    success: false,
                    message:
                        data.message ||
                        (res.status === 409
                            ? "Email/username already in use"
                            : "Signup failed"),
                };
            }

            if (data.user) saveUser(data.user);
            return { success: true };

        } catch (err) {
            console.error(err);
            return { success: false, message: "Signup failed" };
        }
    };

    return (
        <AuthContext.Provider value={{ user, saveUser, login, logout: clearUser, signup }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
