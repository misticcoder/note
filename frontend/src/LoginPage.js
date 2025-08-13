import { useContext, useState } from "react";
import { Authentication } from "./AuthContext";

function LoginPage() {
    const { login } = useContext(Authentication);
    const [ username, setUsername ] = useState("");
    const [ role, setRole ] = useState("user")

    function handleLogin(){
        e.preventDefault();
        login(username, role, "mock-token");
        window.location.href = "/";
    }
    return(
        <div style={{padding: "20px" }}>
            <h2> Login </h2>
            <form onSubmit={handleLogin}>
                <input type="text" placeholder="Username" value={username}
                       onChange={(e) => setUsername(e.target.value)}
                       required
                />
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="guest">Guest</option>
                </select>
                <button type="submit">Login</button>
            </form>
        </div>
    );
}
export default LoginPage;