import { useState } from 'react';
import { renameQuiz } from '../api.js';
import { BackIcon, FileIcon, StudyIcon, TestIcon } from './Icons.jsx';

export default function QuizDetail({ quiz, onBack, onRefresh, onStudy, onTest }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(quiz.title);
  const [error, setError] = useState(null);

  const saveTitle = async () => {
    setEditing(false);
    const next = title.trim();
    if (!next || next === quiz.title) {
      setTitle(quiz.title);
      return;
    }
    try {
      await renameQuiz(quiz.id, next);
      await onRefresh();
    } catch (err) {
      setError(err.message);
      setTitle(quiz.title);
    }
  };

  return (
    <div className="screen quiz-detail">
      <header className="screen-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="button ghost" onClick={onBack}><BackIcon /> Back</button>
        </div>
        <span className="screen-header-file" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={onBack}><FileIcon /> {quiz.fileName}</span>
      </header>

      {editing ? (
        <input
          className="title-input"
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveTitle();
            if (e.key === 'Escape') {
              setTitle(quiz.title);
              setEditing(false);
            }
          }}
        />
      ) : (
        <h1 className="quiz-title" onClick={() => setEditing(true)} title="Tap to rename">
          {quiz.title}
          <span className="rename-hint">Rename</span>
        </h1>
      )}

      {error && <p className="notice error">{error}</p>}
      {quiz.skipped.length > 0 && (
        <p className="notice">
          {quiz.skipped.length} question{quiz.skipped.length > 1 ? 's were' : ' was'} skipped:
          each question needs exactly 4 answers with one marked correct.
        </p>
      )}

      <div className="mode-buttons">
        <button className="button primary" onClick={onStudy} disabled={quiz.questions.length === 0}>
          <StudyIcon /> Study
          <small>Repeat until every card is learned</small>
        </button>
        <button className="button secondary" onClick={onTest} disabled={quiz.questions.length === 0}>
          <TestIcon /> Test
          <small>{Math.min(30, quiz.questions.length)} random questions, graded</small>
        </button>
      </div>

      <h2 className="section-title">Questions</h2>
      <ul className="question-list">
        {quiz.questions.map((question, index) => (
          <li key={question.id} className="question-item">
            <div className="question-item-main">
              <span className="question-index">{String(index + 1).padStart(2, '0')}</span>
              <p>{question.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
