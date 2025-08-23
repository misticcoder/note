import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Dashboard from "./Dashboard";
import Header from "./Header";
import { AuthProvider } from "./AuthContext";
import AdminUsers from "./AdminUsers";
import ThreadList from "./ThreadList";
import ThreadPage from "./ThreadPage";

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
    if (route === "#/threads") Page = ThreadList;
    if (route === "#/admin/users") Page = AdminUsers;
    if (route === "#/admin/threads") Page = ThreadList;
    if (route.startsWith("#/thread/")) Page = () => <ThreadPage/>


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
