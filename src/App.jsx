import { useEffect, useState } from 'react';
import { fetchQuizzes } from './api.js';
import Study from './components/Study.jsx';
import Test from './components/Test.jsx';

export default function App() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState({ name: 'home' });

  useEffect(() => {
    fetchQuizzes()
      .then(setQuizzes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const quiz = quizzes.find((q) => q.id === view.quizId);

  if (view.name === 'study' && quiz) {
    return <Study quiz={quiz} onExit={() => setView({ name: 'home' })} />;
  }

  if (view.name === 'test' && quiz) {
    return <Test quiz={quiz} onExit={() => setView({ name: 'home' })} />;
  }

  return (
    <div className="app">
      <h1>Sage</h1>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && quizzes.length === 0 && (
        <p>No quizzes yet. Drop a markdown file into the quizzes folder.</p>
      )}
      <ul className="quiz-list">
        {quizzes.map((q) => (
          <li key={q.id}>
            <strong>{q.title}</strong> — {q.questions.length} questions
            {q.skipped.length > 0 && (
              <span className="warn"> ({q.skipped.length} skipped, check the file)</span>
            )}
            <button
              className="button"
              disabled={q.questions.length === 0}
              onClick={() => setView({ name: 'study', quizId: q.id })}
            >
              Study
            </button>
            <button
              className="button"
              disabled={q.questions.length === 0}
              onClick={() => setView({ name: 'test', quizId: q.id })}
            >
              Test
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
