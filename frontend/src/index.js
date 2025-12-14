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
import Events from "./Events";
import EventPage from "./EventPage";
import NewsPage from "./NewsPage";
import NewsList from "./NewsList";

function App() {
    const [route, setRoute] = useState(window.location.hash || "#/");

    useEffect(() => {
        const onHashChange = () => setRoute(window.location.hash || "#/");
        window.addEventListener("hashchange", onHashChange);
        if (!window.location.hash) {
            window.location.hash = "#/";
        }
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    let Page = <Dashboard />;

    if (route === "#/admin/users") Page = <AdminUsers />;
    else if (route === "#/threads") Page = <ThreadList />;
    else if (route === "#/admin/threads") Page = <ThreadList />;
    else if (route.startsWith("#/thread/")) Page = <ThreadPage />;
    else if (route === "#/admin/clubs") Page = <Clubs />;
    else if (route === "#/clubs") Page = <Clubs />;
    else if (route.startsWith("#/clubs/")) Page = <ClubDetail />;
    else if (route === "#/admin/events") Page = <Events />;
    else if (route === "#/events") Page = <Events />;
    else if (route.startsWith("#/events/")) Page = <EventPage />;
    else if (route.startsWith("#/news/")) Page = <NewsPage />;
    else if (route === "#/admin/news") Page = <NewsList />;
    else if (route === "#/news") Page = <NewsList />;

    return (
        <>
            <Header />
            {Page}
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
