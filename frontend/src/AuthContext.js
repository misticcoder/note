import { createContext, useState, useContext } from "react";

// AuthContext to manage login state
export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const login = async (email, password) => {
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                return { success: true };
            } else if (res.status === 404) {
                return { success: false, newUser: true };
            } else {
                return { success: false, message: "Invalid credentials" };
            }
        } catch (err) {
            console.error(err);
            return { success: false, message: "Server error" };
        }
    };

    const logout = () => setUser(null);

    const signup = async (email, password, username) => {
        try {
            // Example fetch to backend
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, username }),
            });
            const data = await res.json();

            if (!res.ok) {
                return { success: false, message: data.message || "Signup failed" };
            }

            return { success: true };
        } catch (err) {
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