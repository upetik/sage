/**
 * Renders the four answers of a question in a given display order.
 * After the user selects an answer the correct one is highlighted and,
 * if the selection was wrong, the selection is marked as such.
 */
export default function AnswerList({ question, order, selected, onSelect }) {
  const revealed = selected !== null;
  return (
    <div className="answers">
      {order.map((answerIndex) => {
        const isCorrect = answerIndex === question.correctIndex;
        const isSelected = answerIndex === selected;
        const className = [
          'answer',
          revealed && isCorrect ? 'correct' : '',
          revealed && isSelected && !isCorrect ? 'wrong' : '',
          revealed && !isCorrect && !isSelected ? 'dimmed' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={answerIndex}
            className={className}
            disabled={revealed}
            onClick={() => onSelect(answerIndex)}
          >
            {question.answers[answerIndex]}
          </button>
        );
      })}
    </div>
  );
}
