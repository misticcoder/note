import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Dashboard from "./Dashboard";
import Header from "./Header";
import {AuthProvider} from "./AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <AuthProvider>
    <React.StrictMode>
        <Header />
        <Dashboard/>
    </React.StrictMode>
    </AuthProvider>
);
