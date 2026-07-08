import { useState } from 'react';
import { AddIcon, FileIcon, SyncIcon as SyncSvg, XIcon } from './Icons.jsx';
import { deleteQuiz } from '../api.js';

const THEME_LABELS = { minimal: 'Minimal', sorbet: 'Sorbet' };
export default function Home({
  quizzes,
  loading,
  syncing,
  error,
  theme,
  themes,
  onThemeChange,
  onSync,
  onOpenQuiz,
  onCreateQuiz,
}) {
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('# My new Quizz Title\n\n## Example question\n- Option 01\n- Option 02\n- Option 03\n- *Example correct option');
  return (
    <div className="screen home">
      <header className="home-header">
        <div className="brand" role="button" onClick={() => window.location.assign('/') }>
          <span className="brand-mark" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-icon lucide-brain"><path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/></svg>
          </span>
          <h1 style={{ margin: 0 }}>Sage</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="theme-switcher" role="group" aria-label="Theme">
          {themes.map((t) => (
            <button
              key={t}
              className={`theme-dot theme-dot-${t} ${t === theme ? 'active' : ''}`}
              onClick={() => onThemeChange(t)}
              aria-label={`${THEME_LABELS[t]} theme`}
              title={THEME_LABELS[t]}
            />
          ))}
          </div>
          <button className="button ghost" onClick={() => setCreating(true)} title="Add quiz">
            <AddIcon size={24} />
          </button>
        </div>
      </header>

      <div className="home-hero">
        <p className="hero-kicker">Your own study library</p>
        <h2 className="hero-title">
          Learn it once, <em>keep it</em> forever.
        </h2>
        <button className="button glass sync-button" onClick={onSync} disabled={syncing}>
          <SyncSvg />
          {syncing ? 'Syncing' : 'Sync quizzes'}
        </button>

          {creating && (
          <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setCreating(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Create new quiz</h3>
                <button className="delete-btn" onClick={() => setCreating(false)} aria-label="Close"> <XIcon size={18} /> </button>
              </div>
              <input placeholder="New quizz file name" type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} />
              <div style={{ marginTop: 8 }}>
                <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
              </div>
              <div className="actions">
                <button className="button ghost" onClick={() => setCreating(false)}>Cancel</button>
                <button
                  className="button primary"
                  onClick={async () => {
                    await onCreateQuiz(fileName, content);
                    setCreating(false);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {deleting && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setDeleting(null)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <h3 style={{ margin: 0, width: '100%', textAlign: 'center' }}>Delete quiz</h3>
              <button style={{ position: 'absolute', right: 0 }} className="delete-btn" onClick={() => setDeleting(null)} aria-label="Close"> <XIcon size={16} /> </button>
            </div>
            <p style={{ marginTop: 8, marginBottom: 10, textAlign: 'center' }}>Delete <strong>{deleting.title}</strong>?</p>
            <div className="actions">
              <button className="button ghost" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="button primary small" onClick={async () => {
                try {
                  await deleteQuiz(deleting.id);
                  await onSync();
                } catch (err) {
                  console.error(err);
                } finally {
                  setDeleting(null);
                }
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="notice error">{error}</p>}
      {loading && <p className="notice">Loading your quizzes.</p>}

      {!loading && quizzes.length === 0 && !error && (
        <div className="empty-state glass">
          <h3>No quizzes yet</h3>
          <p>
            Drop a markdown file into the <code>quizzes</code> folder and press Sync. Each question
            is a <code>##</code> heading followed by four answers, the correct one marked with an
            asterisk.
          </p>
        </div>
      )}

      <div className="quiz-grid">
        {quizzes.map((quiz, index) => (
          <div
            key={quiz.id}
            role="button"
            tabIndex={0}
            className={`quiz-card tone-${index % 4}`}
            onClick={() => onOpenQuiz(quiz.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpenQuiz(quiz.id); }}
          >
            <button
              className="delete-btn"
              onClick={async (e) => {
                e.stopPropagation();
                setDeleting(quiz);
              }}
              aria-label={`Delete ${quiz.title}`}
              title="Delete quiz"
            >
              <XIcon size={18} />
            </button>

            <span className="quiz-card-title">{quiz.title}</span>
            <span className="quiz-card-file"><FileIcon size={16} /> {quiz.fileName}</span>
            <span className="quiz-card-count">
              <strong>{String(quiz.questions.length).padStart(2, '0')}</strong>
              <small>questions</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
