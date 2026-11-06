/* TRẠNG THÁI TẢI: phân biệt đang chờ và lỗi kết nối có nút Thử lại. */
function DataStatus({ isLoading, error, reload }) {
  if (isLoading) {
    return (
      <div className="alert alert-info" role="status">
        Đang tải dữ liệu...
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <p>{error}</p>
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={reload}>Thử lại</button>
      </div>
    );
  }
  return null;
}

export default DataStatus;
