import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Dashboard from "./Dashboard";
import Header from "./Header";
import { AuthProvider } from "./AuthContext";
import AdminUsers from "./AdminUsers";
import ThreadList from "./ThreadList";
import ThreadPage from "./ThreadPage";
import ClubDetail from "./ClubDetail";
import Clubs from "./Clubs";

function App() {
    const [route, setRoute] = useState(window.location.hash || "#/");

    useEffect(() => {
        const onHashChange = () => setRoute(window.location.hash || "#/");
        window.addEventListener("hashchange", onHashChange);
        // ensure we always have a hash
        if (!window.location.hash) {
            window.location.hash = "#/";
        }
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    let Page = Dashboard;
    if (route === "#/admin/users") Page = AdminUsers;
    if (route === "#/threads") Page = ThreadList;
    if (route === "#/admin/threads") Page = ThreadList;
    if (route.startsWith("#/thread/")) Page = () => <ThreadPage/>
    if (route === "#/admin/clubs") Page = Clubs;
    if (route === "#/clubs") Page = Clubs;
    if (route.startsWith("#/clubs/")) Page = () => <ClubDetail />


    return (
        <>
            <Header />
            <Page />
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <AuthProvider>
        <React.StrictMode>
            <App />
        </React.StrictMode>
    </AuthProvider>
);
