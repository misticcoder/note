import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import Home from "./Home";
import Header from "./Header";
import { AuthProvider } from "./AuthContext";
import AdminUsers from "./AdminUsers";
import ThreadList from "./Threads/ThreadList";
import ThreadPage from "./Threads/ThreadPage";
import ClubDetail from "./ClubDetail";
import Clubs from "./Clubs";
import Events from "./Events";
import EventPage from "./EventPage";
import NewsPage from "./NewsPage";
import NewsList from "./NewsList";
import PostDetailPage from "./Post/PostDetail";
import TagPage from "./TagPage";
import SearchResultsPage from "./SearchResultPage";
import FrontPage from "./FrontPage";
import ProfilePage from "./Profile/ProfilePage";


function App() {
    const [route, setRoute] = useState(window.location.hash || "#/");
    const clubId = Clubs.id;

    useEffect(() => {
        const onHashChange = () => setRoute(window.location.hash || "#/");
        window.addEventListener("hashchange", onHashChange);
        // ensure we always have a hash
        if (!window.location.hash) {
            window.location.hash = "#/";
        }
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    let Page = FrontPage;


    if (route === "#/home") Page = Home;
    else if (route.startsWith("#/post/")) Page = () => <PostDetailPage />;

    else if (route === "#/profile") Page = ProfilePage;
    else if (route === "#/admin/users") Page = AdminUsers;
    else if (route === "#/threads") Page = ThreadList;
    else if (route === "#/admin/threads") Page = ThreadList;
    else if (route.startsWith("#/threads/")) Page = () => <ThreadPage/>
    else if (route === "#/admin/clubs") Page = Clubs;
    else if (route === "#/clubs") Page = Clubs;
    else if (route.startsWith("#/clubs/")) Page = () => <ClubDetail />


    else if (route === "#/news") Page = NewsList;
    else if (route === "#/admin/news") Page = NewsList;
    else if (route.startsWith("#/news/")) Page = () => <NewsPage/>

    else if (route === "#/admin/events") Page = Events;
    else if (route === "#/events") Page = Events;
    else if (route.startsWith("#/events/")) Page = () => <EventPage />
    else if (route.startsWith("#/tags/")) Page = () => <TagPage />
    else if (route.startsWith("#/search")) Page = () => <SearchResultsPage />;


    return (
        <>
            {route !== "#/" && <Header />}
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
