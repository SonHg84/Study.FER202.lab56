import { useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { createQuestion, updateQuestion } from "../api/questionApi";
import { parseOptions } from "../utils/questions";

/* FORM THÊM/SỬA: dùng chung modal; điền dữ liệu hiện tại khi có question. */
function QuestionModal({ subjectId, question, onClose, onSaved }) {
  const initialOptions = parseOptions(question?.options);
  const [form, setForm] = useState({
    content: question?.content || "",
    optionsText: initialOptions.join("\n"),
    correctAnswer: initialOptions.find((option) =>
      option.toLowerCase() === question?.correctAnswer?.toLowerCase()
    ) || "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const options = parseOptions(form.optionsText);
  const uniqueOptions = [...new Set(options)];

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "optionsText" && !parseOptions(value).includes(previous.correctAnswer)
        ? { correctAnswer: "" } : {}),
    }));
    setError("");
  }

  /* SUBMIT: kiểm tra đáp án và chờ API lưu thành công trước khi đóng modal. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (savingRef.current) return;
    if (!form.content.trim()) {
      setError("Vui lòng nhập nội dung câu hỏi.");
      return;
    }
    if (options.length < 2) {
      setError("Vui lòng nhập ít nhất 2 đáp án.");
      return;
    }
    if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
      setError("Các đáp án không được trùng nhau.");
      return;
    }
    if (!options.includes(form.correctAnswer)) {
      setError("Vui lòng chọn đáp án đúng trong các đáp án.");
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setError("");
    const data = { subjectId, content: form.content.trim(), options, correctAnswer: form.correctAnswer };
    try {
      const savedQuestion = question
        ? await updateQuestion(question.id, data)
        : await createQuestion(data);
      onSaved(savedQuestion);
    } catch (requestError) {
      setError(requestError.response?.status === 404
        ? "Câu hỏi này không còn tồn tại. Hãy tải lại trang."
        : "Không lưu được câu hỏi. Hãy kiểm tra kết nối API và thử lại.");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <Modal show onHide={isSaving ? undefined : onClose} backdrop={isSaving ? "static" : true}
      keyboard={!isSaving} centered size="lg" aria-labelledby="question-modal-title">
      <form onSubmit={handleSubmit} noValidate aria-labelledby="question-modal-title">
        <Modal.Header closeButton={!isSaving}>
          <Modal.Title id="question-modal-title">{question ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          <fieldset disabled={isSaving}>
            <legend className="visually-hidden">Thông tin câu hỏi</legend>
            <div className="mb-3">
              <label htmlFor="question-content" className="form-label">Nội dung câu hỏi</label>
              <textarea id="question-content" className="form-control" name="content" rows={3}
                value={form.content} onChange={handleChange} autoFocus required />
            </div>
            <div className="mb-3">
              <label htmlFor="question-options" className="form-label">Các đáp án</label>
              <textarea id="question-options" className="form-control" name="optionsText" rows={4}
                value={form.optionsText} onChange={handleChange} aria-describedby="question-options-help" required />
              <p id="question-options-help" className="form-hint">Mỗi đáp án một dòng hoặc phân cách bằng dấu chấm phẩy (;).</p>
            </div>
            <div>
              <label htmlFor="question-correct-answer" className="form-label">Đáp án đúng</label>
              <select id="question-correct-answer" className="form-select" name="correctAnswer"
                value={form.correctAnswer} onChange={handleChange} required>
                <option value="">-- Chọn đáp án đúng --</option>
                {uniqueOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </fieldset>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Hủy</button>
          <button type="submit" className="btn btn-success" disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu câu hỏi"}</button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default QuestionModal;
