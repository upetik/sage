// quiz format: "## question" then 4 "- answer" lines, correct one starts with *
// anything else is ignored. bad questions end up in `skipped`.
export function parseQuizMarkdown(text) {
  const lines = text.split(/\r?\n/);
  let title = null;
  const questions = [];
  const skipped = [];
  let current = null;

  const finish = () => {
    if (!current) return;
    const correctCount = current.answers.filter((a) => a.correct).length;
    if (current.answers.length === 4 && correctCount === 1) {
      questions.push({
        text: current.text,
        answers: current.answers.map((a) => a.text),
        correctIndex: current.answers.findIndex((a) => a.correct),
      });
    } else {
      skipped.push(current.text);
    }
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('## ')) {
      finish();
      current = { text: line.slice(3).trim(), answers: [] };
    } else if (line.startsWith('# ') && title === null && current === null) {
      title = line.slice(2).trim();
    } else if (line.startsWith('- ') && current) {
      let answer = line.slice(2).trim();
      const correct = answer.startsWith('*');
      if (correct) answer = answer.slice(1).trim();
      current.answers.push({ text: answer, correct });
    }
  }
  finish();

  return { title, questions, skipped };
}
