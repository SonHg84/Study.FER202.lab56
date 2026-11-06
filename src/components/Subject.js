import { Link } from "react-router-dom";

/* DÒNG MÔN HỌC: số câu được tính từ questions; các nút mở bộ câu hỏi/thông tin. */
function Subject({ subject, questionsCount, onShowInfo }) {
  return (
    <tr>
      <td className="fw-semibold">{subject.id}</td>
      <td>{subject.name}</td>
      <td><span className="count-badge">{questionsCount}</span></td>
      <td>
        <div className="table-actions">
          <Link to={`/questions/${encodeURIComponent(subject.id)}`} className="btn btn-primary btn-sm"
            aria-label={`Truy cập bộ câu hỏi: ${subject.id}`}>Truy cập bộ câu hỏi</Link>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onShowInfo(subject)}
            aria-label={`Thông tin: ${subject.id}`}>Thông tin</button>
        </div>
      </td>
    </tr>
  );
}

export default Subject;
