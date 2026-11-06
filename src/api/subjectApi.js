import api from "./client";

/* GET /subjects: lấy danh sách môn; signal cho phép hủy request khi rời trang. */
export async function getSubjects(options = {}) {
  const response = await api.get("/subjects", options);
  return response.data;
}
