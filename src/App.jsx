import { useCallback, useEffect, useState } from 'react';
import { fetchQuizzes, syncQuizzes, createQuiz } from './api.js';
import Home from './components/Home.jsx';
import QuizDetail from './components/QuizDetail.jsx';
import Study from './components/Study.jsx';
import Test from './components/Test.jsx';

const THEMES = ['minimal', 'sorbet'];
const THEME_KEY = 'sage-theme';

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.includes(saved) ? saved : 'minimal';
  });
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState({ name: 'home' });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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
          theme={theme}
          themes={THEMES}
          onThemeChange={setTheme}
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
      <AppFooter />
    </div>
  );
}

// Footer: Made with heart by Upetik
export function AppFooter() {
  return (
    <footer className="app-footer">
      <a className="app-footer-inner" href="https://github.com/upetik" target="_blank" rel="noreferrer">
        <span>Made with</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-icon lucide-heart"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>
      </a>
    </footer>
  );
}
