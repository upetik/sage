import { useMemo, useRef, useState } from 'react';
import { shuffle } from '../lib/shuffle.js';
import AnswerList from './AnswerList.jsx';
import { BackIcon, LightbulbIcon, StudyIcon, XIcon } from './Icons.jsx';

const SWIPE_THRESHOLD = 90;
  const REVEAL_MS = 120; // short reveal to allow visual highlight
const FLY_MS = 450; // quick exit; the next card fades in right after

export default function Study({ quiz, onExit }) {
  const total = quiz.questions.length;
  const byId = useMemo(
    () => Object.fromEntries(quiz.questions.map((q) => [q.id, q])),
    [quiz.questions],
  );

  const [queue, setQueue] = useState(() => shuffle(quiz.questions.map((q) => q.id)));
  const [learned, setLearned] = useState(() => new Set());
  const [missed, setMissed] = useState(() => new Set());
  const [review, setReview] = useState(() => new Set());
  const [attempts, setAttempts] = useState(0);
  const [selected, setSelected] = useState(null);
  const [leaving, setLeaving] = useState(null); // 'left' | 'right'
  const [dragX, setDragX] = useState(0);
  const [showExplain, setShowExplain] = useState(false);

  const dragRef = useRef({ pointerId: null, startX: 0, moved: false });
  const cardRef = useRef(null);

  const currentId = queue[0];
  const question = currentId ? byId[currentId] : null;
  // reshuffle answers only when the deck advances, not mid-card
  const answerOrder = useMemo(() => shuffle([0, 1, 2, 3]), [queue]);
  const done = queue.length === 0 || learned.size === total;

  const advance = (outcome) => {
    setQueue((q) => {
      const [, ...rest] = q;
      return rest;
    });
    setSelected(null);
    setLeaving(null);
    setDragX(0);
    setShowExplain(false);
  };

  const flyOff = (direction, outcome) => {
    setLeaving(direction);
    setTimeout(() => {
      if (outcome === 'learned') {
        setLearned((s) => new Set(s).add(currentId));
        setMissed((s) => {
          const next = new Set(s);
          next.delete(currentId);
          return next;
        });
        setReview((s) => {
          const next = new Set(s);
          next.delete(currentId);
          return next;
        });
      } else if (outcome === 'missed') {
        setMissed((s) => new Set(s).add(currentId));
      } else if (outcome === 'review') {
        setReview((s) => new Set(s).add(currentId));
      }
      advance(outcome);
    }, FLY_MS);
  };

  const handleSelect = (answerIndex) => {
    if (selected !== null || leaving || dragRef.current.moved) return;
    setSelected(answerIndex);
    setAttempts((n) => n + 1);
    const correct = answerIndex === question.correctIndex;
    // let the highlight render before the card flies off
    requestAnimationFrame(() => {
      setTimeout(() => flyOff(correct ? 'right' : 'left', correct ? 'learned' : 'missed'), REVEAL_MS);
    });
  };

  const handlePointerDown = (event) => {
    if (selected !== null || leaving) return;
    // touches starting on an answer are taps, not drags
    if (event.target.closest && event.target.closest('.answer')) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, moved: false };
    try {
      cardRef.current?.setPointerCapture(event.pointerId);
    } catch (e) {
      // ignore if pointer capture not available
    }
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId || selected !== null || leaving) return;
    const dx = event.clientX - drag.startX;
    if (Math.abs(dx) > 10) drag.moved = true;
    setDragX(dx);
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    dragRef.current = { pointerId: null, startX: 0, moved: drag.moved };
    if (selected !== null || leaving) return;
    const dx = event.clientX - drag.startX;
    if (dx > SWIPE_THRESHOLD) {
      flyOff('right', 'review');
    } else if (dx < -SWIPE_THRESHOLD) {
      flyOff('left', 'missed');
    } else {
      setDragX(0);
    }
    // a finished swipe shouldn't also count as a tap
    requestAnimationFrame(() => {
      dragRef.current.moved = false;
    });
  };

  const cardX = leaving === 'right' ? window.innerWidth : leaving === 'left' ? -window.innerWidth : dragX;
  const cardStyle = {
    transform: `translateX(${cardX}px) rotate(${cardX * 0.04}deg)`,
    opacity: leaving ? 0 : 1,
    transition: dragRef.current.pointerId !== null ? 'none' : `transform ${FLY_MS}ms var(--ease), opacity ${FLY_MS}ms var(--ease)`,
  };

  const secondId = queue[1];
  const secondQuestion = secondId ? byId[secondId] : null;

  return (
    <div className="screen study">
        <header className="screen-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="button ghost" onClick={onExit}><BackIcon /> Exit</button>
          </div>
          <span className="screen-header-file" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StudyIcon size={18} />
            {quiz.title}
          </span>
        </header>

      <div className="progress-row">
        <div className="progress-track" role="progressbar" aria-valuenow={learned.size} aria-valuemax={total}>
          <div className="progress-fill" style={{ width: `${(learned.size / total) * 100}%` }} />
        </div>
        <span className="progress-count">
          {String(learned.size).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      <div className="piles">
        <span className="pile learned">Learned {learned.size}</span>
        <span className="pile review">Review {review.size}</span>
        <span className="pile missed">Missed {missed.size}</span>
      </div>

      {done ? (
        <div className="completion glass">
          <h2>All {learned.size} learned</h2>
          <p>
            You needed {attempts} answer{attempts === 1 ? '' : 's'} while studying.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div className="completion-actions">
              <button
                className="button primary"
                onClick={() => {
                  // Study full deck: reset everything and reshuffle
                  setQueue(shuffle(quiz.questions.map((q) => q.id)));
                  setLearned(new Set());
                  setMissed(new Set());
                  setReview(new Set());
                  setAttempts(0);
                }}
              >
                Study full deck
              </button>
              {Array.from(new Set([...missed, ...review])).length > 0 && (
                <button
                  className="button secondary"
                  onClick={() => {
                    // Learn review & missed questions only
                    const toReview = Array.from(new Set([...missed, ...review]));
                    if (toReview.length === 0) return;
                    setQueue(shuffle(toReview));
                    setLearned(new Set());
                    setMissed(new Set());
                    setReview(new Set());
                    setAttempts(0);
                  }}
                >
                  Learn review & missed questions
                </button>
              )}
            </div>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button className="button secondary done-button" onClick={onExit}>Done</button>
            </div>
          </div>
        </div>
      ) : (
        question && (
          <>
            <div className="card-stack">
                {secondQuestion && (
                  <div key={`behind-${secondId}`} className="card card-behind" aria-hidden="true">
                    {secondQuestion.image && <img className="card-image" src={secondQuestion.image} alt="" draggable="false" />}
                    <h2 className="card-question">{secondQuestion.text}</h2>
                  </div>
                )}
                <div
                ref={cardRef}
                key={currentId}
                className={`card question-card ${review.has(currentId) ? 'flagged' : ''} ${question.explanation ? 'has-hint' : ''}`}
                style={cardStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => setDragX(0)}
              >
                <div className="card-swipe-badges" aria-hidden="true">
                  <span className="swipe-badge review" style={{ opacity: Math.min(1, Math.max(0, dragX / SWIPE_THRESHOLD)) }}>
                    Review later
                  </span>
                  <span className="swipe-badge missed" style={{ opacity: Math.min(1, Math.max(0, -dragX / SWIPE_THRESHOLD)) }}>
                    Missed
                  </span>
                </div>
                {question.explanation && (
                  <button
                    className="hint-button"
                    onClick={() => setShowExplain(true)}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Show hint"
                    title="Hint"
                  >
                    <LightbulbIcon size={18} />
                  </button>
                )}
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
            <p className="swipe-hint">
              Tap an answer, or swipe right to flag for review and left to mark as missed.
            </p>
            {showExplain && question.explanation && (
              <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowExplain(false)}>
                <div className="modal hint-modal" onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Hint</h3>
                    <button className="delete-btn" onClick={() => setShowExplain(false)} aria-label="Close"> <XIcon size={18} /> </button>
                  </div>
                  <p className="hint-text">{question.explanation}</p>
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
