import { useState } from "react";
import { Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DataStatus from "../components/DataStatus";
import SearchBar from "../components/SearchBar";
import Subject from "../components/Subject";
import useSubjectData from "../hooks/useSubjectData";
import { countQuestions } from "../utils/questions";

/* TRANG MÔN HỌC: tải dữ liệu, tìm theo mã/tên và hiển thị số câu thực tế. */
function SubjectsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const request = useSubjectData();
  const { subjects, questions, isLoading, error } = request;
  const [keyword, setKeyword] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const query = keyword.trim().toLowerCase();
  const filteredSubjects = subjects.filter((subject) =>
    subject.id.toLowerCase().includes(query) || subject.name.toLowerCase().includes(query)
  );

  /* LOGOUT: xóa phiên đăng nhập và quay về form Sign In. */
  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="app-main" aria-labelledby="subjects-title">
      <div className="welcome-banner">Hello {user.email} ({user.role})</div>
      <div className="page-heading">
        <h1 id="subjects-title">Danh sách môn học</h1>
        <button type="button" className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      <DataStatus {...request} />
      {!isLoading && !error && (
        <div className="card">
          <div className="card-body">
            <div className="list-toolbar mb-3"><SearchBar keyword={keyword} onSearch={setKeyword} /></div>
            <div className="results-bar mb-3" role="status">
              Hiển thị <strong>{filteredSubjects.length}</strong> / {subjects.length} môn học
            </div>
            <div className="table-responsive table-wrap">
              <table className="table table-hover align-middle mb-0 subject-table">
                <caption className="visually-hidden">Danh sách môn học</caption>
                <thead>
                  <tr>
                    <th scope="col">Mã môn</th><th scope="col">Tên môn học</th>
                    <th scope="col">Số lượng câu hỏi</th><th scope="col">Tools</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject) => (
                    <Subject key={subject.id} subject={subject} questionsCount={countQuestions(questions, subject.id)}
                      onShowInfo={setSelectedSubject} />
                  ))}
                  {filteredSubjects.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-muted py-4">
                      {subjects.length === 0 ? "Chưa có môn học." : "Không tìm thấy môn học."}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* THÔNG TIN MÔN: dùng dữ liệu đã tải, không gọi thêm API. */}
      <Modal show={Boolean(selectedSubject)} onHide={() => setSelectedSubject(null)} centered aria-labelledby="subject-info-title">
        <Modal.Header closeButton><Modal.Title id="subject-info-title">Thông tin môn học</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedSubject && (
            <dl className="subject-details mb-0">
              <dt>Mã môn</dt><dd>{selectedSubject.id}</dd>
              <dt>Tên môn học</dt><dd>{selectedSubject.name}</dd>
              <dt>Số lượng câu hỏi</dt><dd className="mb-0">{countQuestions(questions, selectedSubject.id)}</dd>
            </dl>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={() => setSelectedSubject(null)}>Đóng</button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}

export default SubjectsPage;
