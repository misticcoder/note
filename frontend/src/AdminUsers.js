// frontend/src/AdminUsers.jsx
import { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "./AuthContext";

const ADMIN_KEY = "dev-secret-key"; // optional header if your backend checks it

export default function AdminUsers() {
    const { user } = useContext(AuthContext);
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";
    const isMainAdmin = !!user?.system; // only Main Admin sees "Add User"

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");

    // role edit buffer
    const [editedRoles, setEditedRoles] = useState({});

    // ADD USER modal state
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({
        email: "",
        username: "",
        password: "",
        role: "STUDENT"
    });
    const onForm = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    useEffect(() => {
        if (!isAdmin) return;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/users");
                if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []);
                setErr("");
            } catch (e) {
                console.error(e);
                setErr(e.message || "Failed to load users");
            } finally {
                setLoading(false);
            }
        })();
    }, [isAdmin]);

    const filtered = useMemo(() => {
        const t = (q || "").toLowerCase();
        return users.filter(u =>
            (u.username || "").toLowerCase().includes(t) ||
            (u.email || "").toLowerCase().includes(t) ||
            String(u.role || "").toLowerCase().includes(t)
        );
    }, [users, q]);

    const onChangeRoleLocal = (id, role) => {
        setEditedRoles(prev => ({ ...prev, [id]: role }));
    };

    const saveRole = async (u) => {
        const role = editedRoles[u.id];
        if (!role || role === u.role) return;
        try {
            const res = await fetch(`/api/users/${u.id}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-ADMIN-KEY": ADMIN_KEY
                },
                body: JSON.stringify({ role })
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `Role change failed (${res.status})`);
            }
            const body = await res.json();
            setUsers(prev => prev.map(x => (x.id === u.id ? { ...x, role: body.user.role } : x)));
            setEditedRoles(prev => { const { [u.id]: _, ...rest } = prev; return rest; });
            alert("Role updated");
        } catch (e) {
            alert(e.message || "Role change failed");
        }
    };

    const removeById = async (u) => {
        if (!window.confirm(`Delete user "${u.username}"?`)) return;
        try {
            const res = await fetch(`/api/users/${u.id}`, {
                method: "DELETE",
                headers: { "X-ADMIN-KEY": ADMIN_KEY }
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `Delete failed (${res.status})`);
            }
            setUsers(prev => prev.filter(x => x.id !== u.id));
            setEditedRoles(prev => { const { [u.id]: _, ...rest } = prev; return rest; });
        } catch (e) {
            alert(e.message || "Delete failed");
        }
    };

    const addUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                    // If you protected signup, also send: "X-ADMIN-KEY": ADMIN_KEY
                },
                body: JSON.stringify(form)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || `Signup failed (${res.status})`);
            }
            // API returns { status, user: { id, email, username, role } }
            if (data.user) {
                setUsers(prev => [...prev, { ...data.user, system: false }]);
            }
            setShowAdd(false);
            setForm({ email: "", username: "", password: "", role: "STUDENT" });
            alert("User created");
        } catch (e) {
            alert(e.message || "Signup failed");
        }
    };

    if (!isAdmin) {
        return (
            <div style={styles.wrap}>
                <h2>Users</h2>
                <p>You must be an admin to view this page.</p>
                <a href="#/" style={styles.backLink}>← Back</a>
            </div>
        );
    }

    return (
        <div style={styles.wrap}>
            <div style={styles.headerRow}>
                <h2 style={{ margin: 0 }}>Users</h2>
                <div style={{ display:"flex", gap: 8 }}>
                    <input
                        placeholder="Search username/email/role…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={styles.search}
                    />
                    {isMainAdmin && (
                        <button style={styles.addBtn} onClick={() => setShowAdd(true)}>
                            + Add User
                        </button>
                    )}
                    <a href="#/" style={styles.backLink}>← Back</a>
                </div>
            </div>

            {loading && <p>Loading…</p>}
            {err && <p style={{ color: "red" }}>{err}</p>}

            {!loading && !err && (
                <div style={styles.tableWrap}>
                    <div style={{ ...styles.row, ...styles.head }}>
                        <div style={{ flex: 1 }}>ID</div>
                        <div style={{ flex: 2 }}>Username</div>
                        <div style={{ flex: 3 }}>Email</div>
                        <div style={{ flex: 2 }}>Role</div>
                        <div style={{ width: 260, textAlign: "right" }}>Actions</div>
                    </div>

                    {filtered.map((u) => {
                        const isSystem = !!u.system;
                        const current = editedRoles[u.id] ?? u.role;
                        const roleDirty = current !== u.role;

                        return (
                            <div key={u.id} style={styles.row}>
                                <div style={{ flex: 1 }}>{u.id}</div>
                                <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 8 }}>
                                    <span>{u.username}</span>
                                    {isSystem && <span style={styles.badge}>Main Admin</span>}
                                </div>
                                <div style={{ flex: 3 }}>{u.email}</div>

                                <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 8 }}>
                                    <select
                                        value={current}
                                        onChange={(e) => onChangeRoleLocal(u.id, e.target.value)}
                                        disabled={isSystem}
                                        style={styles.select}
                                    >
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="STUDENT">STUDENT</option>
                                    </select>
                                    <button
                                        onClick={() => saveRole(u)}
                                        disabled={isSystem || !roleDirty}
                                        style={{
                                            ...styles.saveBtn,
                                            opacity: (isSystem || !roleDirty) ? 0.5 : 1,
                                            cursor: (isSystem || !roleDirty) ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        Save
                                    </button>
                                </div>

                                <div style={{ width: 260, textAlign: "right" }}>
                                    <button
                                        onClick={() => removeById(u)}
                                        disabled={isSystem}
                                        style={{
                                            ...styles.delBtn,
                                            opacity: isSystem ? 0.5 : 1,
                                            cursor: isSystem ? "not-allowed" : "pointer"
                                        }}
                                        title={isSystem ? "Main Admin cannot be deleted" : "Delete user"}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div style={{ padding: "12px 8px" }}>No users found.</div>
                    )}
                </div>
            )}

            {/* ADD USER MODAL */}
            {showAdd && (
                <div style={styles.backdrop}>
                    <div style={styles.modal}>
                        <h3 style={{ marginTop: 0 }}>Add New User</h3>
                        <form onSubmit={addUser} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <input
                                name="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={onForm}
                                required
                                style={styles.input}
                            />
                            <input
                                name="username"
                                placeholder="Username"
                                value={form.username}
                                onChange={onForm}
                                required
                                style={styles.input}
                            />
                            <input
                                name="password"
                                placeholder="Password"
                                type="password"
                                value={form.password}
                                onChange={onForm}
                                required
                                style={styles.input}
                            />
                            <select
                                name="role"
                                value={form.role}
                                onChange={onForm}
                                style={styles.select}
                            >
                                <option value="STUDENT">STUDENT</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>

                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={styles.cancelBtn}>
                                    Cancel
                                </button>
                                <button type="submit" style={styles.saveBtn}>
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    wrap: { padding: 20, maxWidth: 960, margin: "0 auto" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    search: { padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6, marginRight: 8 },
    backLink: { textDecoration: "none", border: "1px solid #ccc", padding: "6px 10px", borderRadius: 6, background: "#f8f8f8", color: "#333" },
    addBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },

    tableWrap: { background: "#fff", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" },
    row: { display: "flex", gap: 8, padding: "10px 8px", borderBottom: "1px solid #eee", alignItems: "center" },
    head: { background: "#f5f5f5", fontWeight: "bold" },

    delBtn: { padding: "6px 10px", background: "#b00020", color: "#fff", border: "none", borderRadius: 6 },
    saveBtn: { padding: "6px 10px", background: "#0b57d0", color: "#fff", border: "none", borderRadius: 6 },

    badge: { fontSize: 12, padding: "2px 8px", border: "1px solid #999", borderRadius: 999, background: "#f3f3f3" },
    select: { padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" },

    // modal
    backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modal: { background: "#fff", padding: 20, borderRadius: 8, width: 360, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
    input: { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 }
};
