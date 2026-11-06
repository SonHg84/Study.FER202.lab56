import axios from "axios";

/* CẤU HÌNH API: dùng JSON Server ở cổng 9000 theo đề bài. */
const api = axios.create({
  baseURL: "http://localhost:9000",
  timeout: 10000,
});

export default api;
