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

                <button
                    className="enter-btn"
                    onClick={() => (window.location.hash = `#/home`)}
                >
                    Enter
                </button>
            </div>
        </div>
    );
}
