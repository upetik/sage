import { useCallback, useEffect, useState } from 'react';
import { fetchQuizzes, syncQuizzes, createQuiz } from './api.js';
import Home from './components/Home.jsx';
import QuizDetail from './components/QuizDetail.jsx';
import Study from './components/Study.jsx';
import Test from './components/Test.jsx';

export default function App() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState({ name: 'home' });

  const load = useCallback(async (fn) => {
    try {
      setError(null);
      setQuizzes(await fn());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load(fetchQuizzes).finally(() => setLoading(false));
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    await load(syncQuizzes);
    setSyncing(false);
  };

  const handleCreate = async (fileName, content) => {
    try {
      await createQuiz(fileName, content);
      await load(fetchQuizzes);
    } catch (err) {
      setError(err.message || err);
    }
  };

  const quiz = quizzes.find((q) => q.id === view.quizId);
  const goHome = () => setView({ name: 'home' });
  const openQuiz = (quizId) => setView({ name: 'quiz', quizId });

  return (
    <div className="app">
      {view.name === 'home' && (
        <Home
          quizzes={quizzes}
          loading={loading}
          syncing={syncing}
          error={error}
          onSync={handleSync}
          onOpenQuiz={openQuiz}
          onCreateQuiz={handleCreate}
        />
      )}
      {view.name === 'quiz' && quiz && (
        <QuizDetail
          quiz={quiz}
          onBack={goHome}
          onRefresh={() => load(fetchQuizzes)}
          onStudy={() => setView({ name: 'study', quizId: quiz.id })}
          onTest={() => setView({ name: 'test', quizId: quiz.id })}
          onHome={goHome}
        />
      )}
      {view.name === 'study' && quiz && (
        <Study quiz={quiz} onExit={() => openQuiz(quiz.id)} onHome={goHome} />
      )}
      {view.name === 'test' && quiz && (
        <Test quiz={quiz} onExit={() => openQuiz(quiz.id)} onHome={goHome} />
      )}
      {view.name !== 'home' && !quiz && (
        <div className="empty-state">
          <p>This quiz is no longer available.</p>
          <button className="button" onClick={goHome}>Back to library</button>
        </div>
      )}
    </div>
  );
}
