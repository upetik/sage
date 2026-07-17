// in the static demo (github pages) there is no server: quizzes come from a
// json baked at build time and everything that writes is disabled + hidden
export const isStatic = import.meta.env.VITE_STATIC === '1';

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const readOnly = () => Promise.reject(new Error('Not available in the read-only demo.'));

export const fetchQuizzes = () => request(isStatic ? 'quizzes.json' : '/api/quizzes');
export const syncQuizzes = () => (isStatic ? fetchQuizzes() : request('/api/sync', { method: 'POST' }));
export const fetchQuizRaw = (id) => (isStatic ? readOnly() : request(`/api/quizzes/${id}/raw`));
export const renameQuiz = (id, title) =>
  isStatic ? readOnly() : request(`/api/quizzes/${id}`, json('PATCH', { title }));
export const uploadQuestionImage = (qid, dataUrl) =>
  isStatic ? readOnly() : request(`/api/questions/${qid}/image`, json('POST', { dataUrl }));
export const deleteQuestionImage = (qid) =>
  isStatic ? readOnly() : request(`/api/questions/${qid}/image`, { method: 'DELETE' });
export const createQuiz = (fileName, content) =>
  isStatic ? readOnly() : request('/api/quizzes', json('POST', { fileName, content }));
export const deleteQuiz = (id) => (isStatic ? readOnly() : request(`/api/quizzes/${id}`, { method: 'DELETE' }));
