import { parseOptions } from "../utils/questions";

/* DÒNG CÂU HỎI: gửi thao tác sửa/xóa về trang cha; khóa nút khi đang xóa. */
function Question({ question, stt, onEdit, onDelete, deletingId }) {
  return (
    <tr>
      <td>{stt}</td>
      <td>{question.content}</td>
      <td>{parseOptions(question.options).join(", ")}</td>
      <td className="text-success fw-semibold">{question.correctAnswer}</td>
      <td>
        <div className="table-actions">
          <button type="button" className="btn btn-warning btn-sm" disabled={deletingId !== null}
            aria-label={`Sửa: ${question.content}`} onClick={() => onEdit(question)}>Sửa</button>
          <button type="button" className="btn btn-danger btn-sm" disabled={deletingId !== null}
            aria-label={`Xóa: ${question.content}`} onClick={() => onDelete(question)}>
            {deletingId === question.id ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default Question;
