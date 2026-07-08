import { useState } from 'react';
import { AddIcon, FileIcon, SyncIcon as SyncSvg, XIcon } from './Icons.jsx';
import { deleteQuiz } from '../api.js';

export default function Home({
  quizzes,
  loading,
  syncing,
  error,
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
          <h1 style={{ margin: 0 }}>Sage</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="button ghost" onClick={() => setCreating(true)} title="Add quiz">
            <AddIcon size={24} />
          </button>
        </div>
      </header>

      <div className="home-hero">
        <button className="button sync-button" onClick={onSync} disabled={syncing}>
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
        <div className="empty-state">
          <h3>No quizzes yet</h3>
          <p>
            Drop a markdown file into the <code>quizzes</code> folder and press Sync. Each question
            is a <code>##</code> heading followed by four answers, the correct one marked with an
            asterisk.
          </p>
        </div>
      )}

      <div className="quiz-grid">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            role="button"
            tabIndex={0}
            className="quiz-card"
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
