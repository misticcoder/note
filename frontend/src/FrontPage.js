import { useNavigate } from "react-router-dom";
import "./styles/frontpage.css";

export default function FrontPage() {

    const surveyUrl = "https://forms.gle/YOUR_FORM_LINK";

    const handleSurveyClick = () => {
        const confirmed = window.confirm(
            "You are about to open the usability survey in a new tab.\n\nContinue?"
        );

        if (confirmed) {
            window.open(surveyUrl, "_blank", "noopener,noreferrer");
        }
    };


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
                    Find Tasks: <br></br>Click <b>"Tasks"</b> or Go to <b>"Home"</b> -> Look at <b> Header ->
                    Tasks</b>
                </p>

                <p>
                    Find Survey: <br></br>Go to <b>"Home"</b> -> Look at <b> Header -> Survey </b>
                </p>

            </div>
        </div>
    );
}
