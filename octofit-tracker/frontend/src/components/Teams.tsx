import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: result }) => setTeams(result))
      .catch(() => setError(true));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {error ? (
          <p role="alert">Unable to load teams.</p>
        ) : teams === null ? (
          <p role="status">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          <ul>
            {teams.map((team, index) => (
              <li key={team._id ?? `${team.name}-${index}`}>
                <strong>{team.name}</strong> ({team.mascot})
                <span> - {team.members.length} members</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
