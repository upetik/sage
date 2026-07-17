import { useRef, useState } from 'react';
import { AddIcon, FileIcon, SyncIcon as SyncSvg, XIcon } from './Icons.jsx';
import HeaderBar from './HeaderBar.jsx';
import { deleteQuiz } from '../api.js';

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
  const [content, setContent] = useState('# My new Quizz Title\n\n## Example question\n- Option 01\n- Option 02\n- Option 03\n- *Example correct option\n> Optional hint, opened from the lightbulb on the card. Delete this line if not needed.');
  const mdInputRef = useRef(null);

  const handleMdFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    for (const file of files) {
      const text = await file.text();
      await onCreateQuiz(file.name.replace(/\.(md|markdown)$/i, ''), text);
    }
    setCreating(false);
  };
  return (
    <div className="screen home">
      <HeaderBar theme={theme} themes={themes} onThemeChange={onThemeChange} />

      <div className="home-hero">
        <p className="hero-kicker">Your own study library</p>
        <h2 className="hero-title">
          Learn it once, <em>keep it</em> forever.
        </h2>
        <div className="hero-actions">
          <button className="button glass sync-button" onClick={() => setCreating(true)}>
            <AddIcon size={16} />
            Add new Quizz
          </button>
          <button className="button glass sync-button" onClick={onSync} disabled={syncing}>
            <SyncSvg />
            {syncing ? 'Syncing' : 'Sync'}
          </button>
        </div>

          {creating && (
          <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setCreating(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Create new quiz</h3>
                <button className="delete-btn" onClick={() => setCreating(false)} aria-label="Close"> <XIcon size={18} /> </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
                <button className="button ghost small" onClick={() => mdInputRef.current?.click()}>
                  <FileIcon size={16} /> Upload .md files
                </button>
                <small style={{ color: 'var(--text-muted)' }}>one quiz per file, or write one below</small>
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
              <input
                ref={mdInputRef}
                type="file"
                accept=".md,.markdown,text/markdown"
                multiple
                hidden
                onChange={handleMdFiles}
              />
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
