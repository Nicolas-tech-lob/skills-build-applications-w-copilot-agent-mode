import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus: string;
  reason: string;
  minutes?: number;
  difficulty?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const userEmail = encodeURIComponent('mona@example.com');
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${userEmail}`)
      .then(({ suggestions: result }) => setSuggestions(result))
      .catch(() => setError(true));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {error ? (
          <p role="alert">Unable to load workout suggestions.</p>
        ) : suggestions === null ? (
          <p role="status">Loading workout suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p>No workout suggestions yet.</p>
        ) : (
          <ul>
            {suggestions.map((workout, index) => (
              <li key={`${workout.title}-${index}`}>
                <strong>{workout.title}</strong> ({workout.focus})
                {workout.minutes !== undefined && <span> - {workout.minutes} minutes</span>}
                {workout.difficulty && <span> - {workout.difficulty}</span>}
                <p>{workout.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
