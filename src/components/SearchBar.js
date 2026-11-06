/* TÌM MÔN HỌC: gửi từ khóa về trang cha để lọc ngay theo mã hoặc tên. */
function SearchBar({ keyword, onSearch }) {
  return (
    <div role="search">
      <label htmlFor="subject-search" className="form-label">Tìm kiếm môn học</label>
      <input id="subject-search" className="form-control" type="search"
        placeholder="Tìm kiếm môn học..." value={keyword}
        onChange={(event) => onSearch(event.target.value)} />
    </div>
  );
}

export default SearchBar;
