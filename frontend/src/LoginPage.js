import { useState } from "react";

function LoginForm({ onLoginSuccess }) {
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const [message, setMessage] = useState("");

    const checkUser = async () => {
        const res = await fetch(`/api/auth/check-user?usernameOrEmail=${usernameOrEmail}`);
        const exists = await res.json();
        setIsNewUser(!exists);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isNewUser) {
            // Signup
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password }),
            });
            if (res.ok) {
                const data = await res.json();
                onLoginSuccess(data);
            } else {
                const error = await res.text();
                setMessage(error);
            }
        } else {
            // Login
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usernameOrEmail, password }),
            });
            if (res.ok) {
                const data = await res.json();
                onLoginSuccess(data);
            } else {
                setMessage("Invalid credentials");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
                type="text"
                placeholder="Username or Email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                onBlur={checkUser} // Check user on blur
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">{isNewUser ? "Sign Up" : "Log In"}</button>
            {message && <p style={{ color: "red" }}>{message}</p>}
            {isNewUser && <small>You will be signed up automatically</small>}
        </form>
    );
}

export default LoginForm;
