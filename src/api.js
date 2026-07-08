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

export const fetchQuizzes = () => request('/api/quizzes');
export const syncQuizzes = () => request('/api/sync', { method: 'POST' });
export const renameQuiz = (id, title) => request(`/api/quizzes/${id}`, json('PATCH', { title }));
export const uploadQuestionImage = (qid, dataUrl) =>
  request(`/api/questions/${qid}/image`, json('POST', { dataUrl }));
export const deleteQuestionImage = (qid) =>
  request(`/api/questions/${qid}/image`, { method: 'DELETE' });
export const createQuiz = (fileName, content) => request('/api/quizzes', json('POST', { fileName, content }));
export const deleteQuiz = (id) => request(`/api/quizzes/${id}`, { method: 'DELETE' });
