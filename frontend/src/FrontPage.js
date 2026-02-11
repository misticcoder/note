import { useNavigate } from "react-router-dom";
import "./styles/frontpage.css";

export default function FrontPage() {


    return (
        <div className="front-page">
            <div className="front-hero">
                <h1>Informatics Community Hub</h1>
                <p>
                    Discover events, sports, and communities — all in one place.
                </p>
                <div className={"f-buttons"}>
                    <button
                        className="enter-btn"
                        onClick={() => (window.location.hash = `#/home`)}
                    >
                        Home
                    </button>

                    <button
                        className="enter-btn"
                        onClick={() => (window.location.hash = `#/usability-tasks`)}
                    >
                        Tasks
                    </button>
                </div>
                <p></p>
                <p>
                    Find Tasks: <br></br>Click <b>"Tasks"</b> or Look at <b> Header -> SideNavigation -> Usability Tasks</b>
                </p>

            </div>
        </div>
    );
}
