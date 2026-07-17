import { useRef, useState } from 'react';
import { createQuiz, deleteQuestionImage, fetchQuizRaw, isStatic, renameQuiz, uploadQuestionImage } from '../api.js';
import { BackIcon, FileIcon, StudyIcon, TestIcon, XIcon } from './Icons.jsx';
import HeaderBar from './HeaderBar.jsx';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

export default function QuizDetail({ quiz, theme, themes, onThemeChange, onBack, onRefresh, onStudy, onTest, onHome }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(quiz.title);
  const [busyQuestion, setBusyQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [editingFile, setEditingFile] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [savingFile, setSavingFile] = useState(false);
  const fileInputRef = useRef(null);
  const pendingQuestionRef = useRef(null);

  const openFileEditor = async () => {
    setError(null);
    try {
      const { content } = await fetchQuizRaw(quiz.id);
      setFileContent(content);
      setEditingFile(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveFile = async () => {
    setSavingFile(true);
    setError(null);
    try {
      await createQuiz(quiz.fileName, fileContent);
      await onRefresh();
      setEditingFile(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingFile(false);
    }
  };

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

  const pickImage = (questionId) => {
    pendingQuestionRef.current = questionId;
    fileInputRef.current?.click();
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    const questionId = pendingQuestionRef.current;
    event.target.value = '';
    if (!file || !questionId) return;
    setBusyQuestion(questionId);
    setError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await uploadQuestionImage(questionId, dataUrl);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyQuestion(null);
    }
  };

  const removeImage = async (questionId) => {
    setBusyQuestion(questionId);
    setError(null);
    try {
      await deleteQuestionImage(questionId);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyQuestion(null);
    }
  };

  return (
    <div className="screen quiz-detail">
      <HeaderBar theme={theme} themes={themes} onThemeChange={onThemeChange} onHome={onHome} />
      <header className="screen-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="button ghost" onClick={onBack}><BackIcon /> Back</button>
        </div>
        {isStatic ? (
          <span className="screen-header-file" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FileIcon /> {quiz.fileName}
          </span>
        ) : (
          <button className="button ghost small" onClick={openFileEditor} title="Edit the quiz file">
            <FileIcon /> {quiz.fileName}
          </button>
        )}
      </header>

      {editingFile && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setEditingFile(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Edit {quiz.fileName}</h3>
              <button className="delete-btn" onClick={() => setEditingFile(false)} aria-label="Close"> <XIcon size={18} /> </button>
            </div>
            <textarea rows={14} value={fileContent} onChange={(e) => setFileContent(e.target.value)} />
            <div className="actions">
              <button className="button ghost" onClick={() => setEditingFile(false)}>Cancel</button>
              <button className="button primary" onClick={saveFile} disabled={savingFile}>
                {savingFile ? 'Saving' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <h1
          className="quiz-title"
          onClick={isStatic ? undefined : () => setEditing(true)}
          title={isStatic ? undefined : 'Tap to rename'}
        >
          {quiz.title}
          {!isStatic && <span className="rename-hint">Rename</span>}
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
          <li key={question.id} className="question-item glass">
            <div className="question-item-main">
              <span className="question-index">{String(index + 1).padStart(2, '0')}</span>
              <p>{question.text}</p>
            </div>
            {question.image && (
              <img className="question-thumb" src={question.image} alt="" loading="lazy" />
            )}
            {!isStatic && (
              <div className="question-item-actions">
                <button
                  className="button ghost small"
                  onClick={() => pickImage(question.id)}
                  disabled={busyQuestion === question.id}
                >
                  {question.image ? 'Replace image' : 'Add image'}
                </button>
                {question.image && (
                  <button
                    className="button ghost small"
                    onClick={() => removeImage(question.id)}
                    disabled={busyQuestion === question.id}
                  >
                    Remove image
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={handleFile}
      />
    </div>
  );
}
