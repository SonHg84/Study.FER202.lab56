import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { deleteQuestion } from "../api/questionApi";
import DataStatus from "../components/DataStatus";
import Question from "../components/Question";
import QuestionModal from "../components/QuestionModal";
import useSubjectData from "../hooks/useSubjectData";

function QuestionsPage() {
  const { subjectId } = useParams();
  const request = useSubjectData();
  const { subjects, questions, setQuestions, isLoading, error } = request;
  const [editor, setEditor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [message, setMessage] = useState("");
  const deletingRef = useRef(false);
  const subject = subjects.find((item) => item.id === subjectId);
  const subjectQuestions = questions.filter((question) => question.subjectId === subjectId);

  async function handleDelete(question) {
    if (deletingRef.current) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa câu hỏi “${question.content}”?`)) return;
    deletingRef.current = true;
    setDeletingId(question.id);
    setDeleteError("");
    setMessage("");

    try {
      await deleteQuestion(question.id);
      setQuestions((previous) => previous.filter((item) => item.id !== question.id));
      setMessage("Đã xóa câu hỏi.");
    } catch {
      setDeleteError("Không xóa được câu hỏi. Hãy kiểm tra kết nối API và thử lại.");
    } finally {
      deletingRef.current = false;
      setDeletingId(null);
    }
  }

  function handleSaved(savedQuestion) {
    const isEditing = Boolean(editor.question);
    setQuestions((previous) => isEditing
      ? previous.map((item) => item.id === savedQuestion.id ? savedQuestion : item)
      : [...previous, savedQuestion]);
    setEditor(null);
    setDeleteError("");
    setMessage(isEditing ? "Đã cập nhật câu hỏi." : "Đã thêm câu hỏi mới.");
  }

  return (
    <main className="app-main">
      <DataStatus {...request} />
      {!isLoading && !error && !subject && (
        <>
          <div className="alert alert-warning" role="alert">Không tìm thấy môn học có mã {subjectId}.</div>
          <Link to="/subjects" className="btn btn-secondary">Quay lại danh sách môn</Link>
        </>
      )}
      {!isLoading && !error && subject && (
        <section aria-labelledby="questions-title">
          <div className="page-heading question-heading">
            <div>
              <h1 id="questions-title">Bộ câu hỏi môn: {subject.name} ({subject.id})</h1>
              <p className="page-description">Tổng số câu hỏi: <strong>{subjectQuestions.length}</strong></p>
            </div>
            <div className="table-actions">
              <button type="button" className="btn btn-success" disabled={deletingId !== null}
                onClick={() => setEditor({ question: null })}>+ Thêm câu hỏi mới</button>
              <Link to="/subjects" className="btn btn-secondary">Quay lại danh sách môn</Link>
            </div>
          </div>

          {deleteError && <div className="alert alert-danger" role="alert">{deleteError}</div>}
          {message && (
            <div className="alert alert-success d-flex justify-content-between align-items-center gap-3" role="status">
              <span>{message}</span>
              <button type="button" className="btn-close" aria-label="Đóng thông báo" onClick={() => setMessage("")} />
            </div>
          )}

          <div className="card"><div className="card-body">
            <div className="table-responsive table-wrap">
              <table className="table table-hover align-middle mb-0 question-table">
                <caption className="visually-hidden">Bộ câu hỏi môn {subject.id}</caption>
                <thead className="table-dark">
                  <tr>
                    <th scope="col">#</th><th scope="col">Nội dung câu hỏi</th><th scope="col">Các đáp án</th>
                    <th scope="col">Đáp án đúng</th><th scope="col">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectQuestions.map((question, index) => (
                    <Question key={question.id} question={question} stt={index + 1} deletingId={deletingId}
                      onEdit={(selected) => setEditor({ question: selected })} onDelete={handleDelete} />
                  ))}
                  {subjectQuestions.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-4">Môn học chưa có câu hỏi.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div></div>

          {/* Modal được tạo lại khi mở, nên form thêm/sửa luôn có dữ liệu tương ứng. */}
          {editor && <QuestionModal subjectId={subject.id} question={editor.question}
            onClose={() => setEditor(null)} onSaved={handleSaved} />}
        </section>
      )}
    </main>
  );
}

export default QuestionsPage;
