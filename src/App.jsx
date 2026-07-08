import { useEffect, useState } from 'react';

export default function App() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/quizzes')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(setQuizzes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <h1>Sage</h1>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && quizzes.length === 0 && (
        <p>No quizzes yet. Drop a markdown file into the quizzes folder.</p>
      )}
      <ul className="quiz-list">
        {quizzes.map((quiz) => (
          <li key={quiz.id}>
            <strong>{quiz.title}</strong> — {quiz.questions.length} questions
            {quiz.skipped.length > 0 && (
              <span className="warn"> ({quiz.skipped.length} skipped, check the file)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
