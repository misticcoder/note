import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

export default function Clubs() {
    const { user } = useContext(AuthContext);
    const [clubs, setClubs] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    useEffect(() => {
        fetch("/api/clubs").then(r=>r.json()).then(setClubs).catch(()=>setClubs([]));
    }, []);

    const createClub = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        const res = await fetch(`/api/clubs?requesterEmail=${encodeURIComponent(user.email)}`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ name, description })
        });
        const body = await res.json().catch(()=>({}));
        if (!res.ok) { alert(body.message || "Failed"); return; }
        setClubs(prev=>[...prev, body]); setName(""); setDescription("");
    };

    const requestJoin = async (clubId) => {
        if (!user) { alert("Login required"); return; }
        const res = await fetch(`/api/clubs/${clubId}/join?requesterEmail=${encodeURIComponent(user.email)}`, { method: "POST" });
        const body = await res.json().catch(()=>({}));
        if (!res.ok) { alert(body.message || "Failed"); return; }
        alert("Join request sent");
    };

    return (
        <div style={{maxWidth:900, margin:"0 auto", padding:20}}>
            <h2>Clubs</h2>

            {isAdmin && (
                <form onSubmit={createClub} style={{display:"grid", gap:8, marginBottom:16}}>
                    <h3>Create Club</h3>
                    <input placeholder="Club name" value={name} onChange={e=>setName(e.target.value)} required />
                    <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} required />
                    <button type="submit">Create</button>
                </form>
            )}

            <div>
                {clubs.map(c=>(
                    <div key={c.id} style={{border:"1px solid #ddd", borderRadius:8, padding:12, marginBottom:10}}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                            <h3 style={{margin:0}}>{c.name}</h3>
                            <a href={`#/clubs/${c.id}`} style={{textDecoration:"none"}}>View</a>
                        </div>
                        <p>{c.description}</p>
                        <button onClick={()=>requestJoin(c.id)}>Request to Join</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
