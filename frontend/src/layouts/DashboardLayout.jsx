import Sidebar from "../components/sidebar";
import "../styles/dashboard.css";

export default function DashboardLayout({ children }) {
    return (
        <div className="dashboard-root">
            <Sidebar />
            <main className="dashboard-main">{children}</main>
        </div>
    );
}
