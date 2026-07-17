// builds the read-only demo for github pages: runs vite with VITE_STATIC=1
// (relative base, admin ui hidden) and bakes the quizzes into dist/quizzes.json
// so no server is needed. mirrors the shape /api/quizzes returns.
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseQuizMarkdown } from '../server/parser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUIZ_DIR = path.join(ROOT, 'quizzes');
const IMAGE_DIR = path.join(ROOT, 'data', 'images');
const META_FILE = path.join(ROOT, 'data', 'metadata.json');
const DIST_DIR = path.join(ROOT, 'dist');

execSync('npx vite build', {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, VITE_STATIC: '1' },
});

const questionId = (quizId, text) =>
  crypto.createHash('sha1').update(`${quizId}\n${text}`).digest('hex').slice(0, 12);

let meta = { quizzes: {}, images: {} };
try {
  meta = JSON.parse(await fs.readFile(META_FILE, 'utf8'));
} catch {
  // no metadata yet, defaults are fine
}

const quizzes = [];
const entries = await fs.readdir(QUIZ_DIR);
for (const fileName of entries.filter((f) => f.endsWith('.md')).sort()) {
  const raw = await fs.readFile(path.join(QUIZ_DIR, fileName), 'utf8');
  const { title, questions, skipped } = parseQuizMarkdown(raw);
  const id = fileName.replace(/\.md$/, '');
  const seen = new Map();
  quizzes.push({
    id,
    fileName,
    title: meta.quizzes[id]?.title || title || id,
    skipped,
    questions: questions.map((q) => {
      const n = seen.get(q.text) || 0;
      seen.set(q.text, n + 1);
      const qid = questionId(id, n === 0 ? q.text : `${q.text}#${n + 1}`);
      const image = meta.images[qid];
      return { id: qid, ...q, image: image ? `images/${image}` : null };
    }),
  });
}

await fs.writeFile(path.join(DIST_DIR, 'quizzes.json'), JSON.stringify(quizzes));

try {
  await fs.cp(IMAGE_DIR, path.join(DIST_DIR, 'images'), { recursive: true });
} catch {
  // no images yet
}

console.log(`static build ready: ${quizzes.length} quizzes baked into dist/`);
