/* DỮ LIỆU CŨ: tách các lựa chọn đang gộp bằng dấu ; hoặc xuống dòng. */
export function parseOptions(value) {
  const values = Array.isArray(value) ? value : [value || ""];
  return values.flatMap((option) => String(option).split(/[;\n]/))
    .map((option) => option.trim())
    .filter(Boolean);
}

/* ĐẾM CÂU THẬT: bỏ qua subjects.questionsCount vì bộ đếm này có thể đã cũ. */
export function countQuestions(questions, subjectId) {
  return questions.filter((question) => question.subjectId === subjectId).length;
}
