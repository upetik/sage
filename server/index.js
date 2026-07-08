import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseQuizMarkdown } from './parser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUIZ_DIR = path.join(ROOT, 'quizzes');
const DIST_DIR = path.join(ROOT, 'dist');
const PORT = process.env.PORT || 4400;

const app = express();
app.use(express.json());

async function loadQuizzes() {
  await fs.mkdir(QUIZ_DIR, { recursive: true });
  const entries = await fs.readdir(QUIZ_DIR);
  const quizzes = [];

  for (const fileName of entries.filter((f) => f.endsWith('.md')).sort()) {
    const raw = await fs.readFile(path.join(QUIZ_DIR, fileName), 'utf8');
    const { title, questions, skipped } = parseQuizMarkdown(raw);
    const id = fileName.replace(/\.md$/, '');
    quizzes.push({
      id,
      fileName,
      title: title || id,
      skipped,
      questions: questions.map((q, i) => ({ id: `${id}-${i}`, ...q })),
    });
  }
  return quizzes;
}

app.get('/api/quizzes', async (req, res, next) => {
  try {
    res.json(await loadQuizzes());
  } catch (err) {
    next(err);
  }
});

app.use(express.static(DIST_DIR));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Sage server running at http://localhost:${PORT}`);
});
