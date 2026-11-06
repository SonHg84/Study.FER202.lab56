import api from "./client";

/* GET /accounts: lấy tài khoản để kiểm tra đăng nhập qua Mock API. */
export async function getAccounts() {
  const response = await api.get("/accounts");
  return response.data;
}
