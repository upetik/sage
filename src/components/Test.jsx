import { useMemo, useState } from 'react';
import { shuffle } from '../lib/shuffle.js';
import AnswerList from './AnswerList.jsx';
import { BackIcon, LearnedIcon, TestIcon } from './Icons.jsx';

const TEST_SIZE = 30;
const REVEAL_MS = 900;

export default function Test({ quiz, onExit }) {
  const [round, setRound] = useState(0);
  const questions = useMemo(
    () => shuffle(quiz.questions).slice(0, Math.min(TEST_SIZE, quiz.questions.length)),
    [quiz.questions, round],
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);

  const question = questions[index];
  const answerOrder = useMemo(() => shuffle([0, 1, 2, 3]), [question]);
  const finished = index >= questions.length;

  const handleSelect = (answerIndex) => {
    if (selected !== null) return;
    setSelected(answerIndex);
    const correct = answerIndex === question.correctIndex;
    setTimeout(() => {
      setResults((r) => [...r, { question, selected: answerIndex, correct }]);
      setSelected(null);
      setIndex((i) => i + 1);
    }, REVEAL_MS);
  };

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setSelected(null);
    setResults([]);
  };

  if (finished) {
    const correctCount = results.filter((r) => r.correct).length;
    const percent = Math.round((correctCount / results.length) * 100);
    const missed = results.filter((r) => !r.correct);
    const gradeIcon = percent === 100 ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-party-popper-icon lucide-party-popper"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>
    ) : percent >= 80 ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sticker-icon lucide-sticker"><path d="M21 9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/><path d="M15 3v5a1 1 0 0 0 1 1h5"/><path d="M8 13h.01"/><path d="M16 13h.01"/><path d="M10 16s.8 1 2 1c1.3 0 2-1 2-1"/></svg>
    ) : percent <= 49 ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-thumbs-up-icon lucide-thumbs-up"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/><path d="M7 10v12"/></svg>
    ) : (
      <LearnedIcon size={18} />
    );
    return (
      <div className="screen test">
        <header className="screen-header">
          <button className="button ghost" onClick={onExit}><BackIcon /> Exit</button>
          <span className="screen-header-file" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TestIcon size={18} />
            {quiz.title}
          </span>
        </header>
        <div className="score glass">
          <p className="score-label">
            {gradeIcon}
            Your score
          </p>
          <p className="score-value">{percent}%</p>
          <p className="score-detail">
            You answered {correctCount} of {results.length} questions correctly.
          </p>
          <div className="completion-actions">
            <button className="button primary" onClick={restart}>Take another test</button>
            <button className="button secondary done-button" onClick={onExit}>Done</button>
          </div>
        </div>
        {missed.length > 0 && (
          <>
            <h2 className="section-title">Worth another look</h2>
            <ul className="missed-list">
              {missed.map(({ question: q, selected: s }) => (
                <li key={q.id} className="missed-item glass">
                  <p className="missed-question">{q.text}</p>
                  <p className="missed-answer wrong">Your answer: {q.answers[s]}</p>
                  <p className="missed-answer correct">Correct: {q.answers[q.correctIndex]}</p>
                  {q.explanation && <p className="missed-explanation">{q.explanation}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="screen test">
      <header className="screen-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="button ghost" onClick={onExit}><BackIcon /> Exit</button>
        </div>
        <span className="screen-header-file" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TestIcon size={18} />
          {quiz.title}
        </span>
      </header>

      <div className="progress-row">
        <div className="progress-track" role="progressbar" aria-valuenow={index} aria-valuemax={questions.length}>
          <div className="progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="progress-count">
          {String(index + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
        </span>
      </div>

      <div className="card-stack">
        <div key={question.id} className="card question-card">
          {question.image && <img className="card-image" src={question.image} alt="" draggable="false" />}
          <h2 className="card-question">{question.text}</h2>
          <AnswerList
            question={question}
            order={answerOrder}
            selected={selected}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}
