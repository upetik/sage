import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseQuizMarkdown } from './parser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUIZ_DIR = path.join(ROOT, 'quizzes');
const DATA_DIR = path.join(ROOT, 'data');
const IMAGE_DIR = path.join(DATA_DIR, 'images');
const META_FILE = path.join(DATA_DIR, 'metadata.json');
const DIST_DIR = path.join(ROOT, 'dist');
const PORT = process.env.PORT || 4400;

const app = express();
app.use(express.json({ limit: '25mb' }));

async function ensureDirs() {
  await fs.mkdir(QUIZ_DIR, { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });
}

async function readMetadata() {
  try {
    return JSON.parse(await fs.readFile(META_FILE, 'utf8'));
  } catch {
    return { quizzes: {}, images: {} };
  }
}

async function writeMetadata(meta) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(META_FILE, JSON.stringify(meta, null, 2));
}

const questionId = (quizId, text) =>
  crypto.createHash('sha1').update(`${quizId}\n${text}`).digest('hex').slice(0, 12);

async function loadQuizzes() {
  const meta = await readMetadata();
  const entries = await fs.readdir(QUIZ_DIR);
  const quizzes = [];

  for (const fileName of entries.filter((f) => f.endsWith('.md')).sort()) {
    const raw = await fs.readFile(path.join(QUIZ_DIR, fileName), 'utf8');
    const { title, questions, skipped } = parseQuizMarkdown(raw);
    const id = fileName.replace(/\.md$/, '');
    quizzes.push({
      id,
      fileName,
      title: meta.quizzes[id]?.title || title || id,
      skipped,
      questions: questions.map((q) => {
        const qid = questionId(id, q.text);
        const image = meta.images[qid];
        return { id: qid, ...q, image: image ? `/images/${image}` : null };
      }),
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

app.post('/api/sync', async (req, res, next) => {
  try {
    res.json(await loadQuizzes());
  } catch (err) {
    next(err);
  }
});

app.post('/api/quizzes', async (req, res, next) => {
  try {
    const { fileName, content } = req.body;
    if (typeof fileName !== 'string' || !fileName.trim()) {
      return res.status(400).json({ error: 'A non-empty fileName is required.' });
    }
    // don't let file names escape the quizzes dir
    if (fileName.includes('/') || fileName.includes('..')) {
      return res.status(400).json({ error: 'Invalid fileName.' });
    }
    const name = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    const filePath = path.join(QUIZ_DIR, name);
    await fs.writeFile(filePath, typeof content === 'string' ? content : '# New quiz\n');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.patch('/api/quizzes/:id', async (req, res, next) => {
  try {
    const { title } = req.body;
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'A non-empty title is required.' });
    }
    const meta = await readMetadata();
    meta.quizzes[req.params.id] = { ...meta.quizzes[req.params.id], title: title.trim() };
    await writeMetadata(meta);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/quizzes/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const filePath = path.join(QUIZ_DIR, `${id}.md`);
    await fs.rm(filePath, { force: true });

    // drop the stored title too
    const meta = await readMetadata();
    if (meta.quizzes && meta.quizzes[id]) delete meta.quizzes[id];
    await writeMetadata(meta);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.post('/api/questions/:qid/image', async (req, res, next) => {
  try {
    const { dataUrl } = req.body;
    const match = /^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/.exec(dataUrl || '');
    if (!match) {
      return res.status(400).json({ error: 'Expected a base64 image data URL.' });
    }
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const fileName = `${req.params.qid}.${ext}`;
    await fs.writeFile(path.join(IMAGE_DIR, fileName), Buffer.from(match[2], 'base64'));

    const meta = await readMetadata();
    const previous = meta.images[req.params.qid];
    if (previous && previous !== fileName) {
      await fs.rm(path.join(IMAGE_DIR, previous), { force: true });
    }
    meta.images[req.params.qid] = fileName;
    await writeMetadata(meta);
    res.json({ image: `/images/${fileName}` });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/questions/:qid/image', async (req, res, next) => {
  try {
    const meta = await readMetadata();
    const fileName = meta.images[req.params.qid];
    if (fileName) {
      await fs.rm(path.join(IMAGE_DIR, fileName), { force: true });
      delete meta.images[req.params.qid];
      await writeMetadata(meta);
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.use('/images', express.static(IMAGE_DIR));
app.use(express.static(DIST_DIR));
app.get(/^\/(?!api|images).*/, (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

await ensureDirs();
app.listen(PORT, () => {
  console.log(`Sage server running at http://localhost:${PORT}`);
});
