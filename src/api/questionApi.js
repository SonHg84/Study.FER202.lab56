import api from "./client";

export async function getQuestions(options = {}) {
  const response = await api.get("/questions", options);
  return response.data;
}

export async function createQuestion(question) {
  const response = await api.post("/questions", question);
  return response.data;
}

export async function updateQuestion(id, question) {
  const response = await api.patch(`/questions/${encodeURIComponent(id)}`, question);
  return response.data;
}

export async function deleteQuestion(id) {
  await api.delete(`/questions/${encodeURIComponent(id)}`);
}
