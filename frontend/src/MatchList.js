import { useEffect, useState } from "react";

function MatchList() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch("/api/matches")
      .then(res => res.json())
      .then(data => setMatches(data));
  }, []);

  return (
    <div>
      <h2>Upcoming Matches</h2>
      <ul>
        {matches.map(m => (
          <li key={m.id}>
            {m.teamA} vs {m.teamB} — {m.result ?? "Pending"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MatchList;