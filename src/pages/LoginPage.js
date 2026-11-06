import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccounts } from "../api/accountApi";
import { useAuth } from "../contexts/AuthContext";

/* TRANG ĐĂNG NHẬP: kiểm tra tài khoản, trạng thái và vai trò theo Mock API. */
function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  }

  /* SUBMIT: chặn gửi trùng; chỉ lưu phiên và chuyển trang khi đăng nhập hợp lệ. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!form.email.trim() || !form.password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setError("");

    try {
      const accounts = await getAccounts();
      const account = accounts.find((item) =>
        item.email.toLowerCase() === form.email.trim().toLowerCase() && item.password === form.password
      );
      if (!account) {
        setError("Email hoặc mật khẩu không chính xác.");
      } else if (account.status?.toLowerCase() !== "active") {
        setError("Tài khoản đã bị khóa");
      } else if (!["student", "lecturer"].includes(account.role?.toLowerCase())) {
        setError("Tài khoản không có quyền truy cập.");
      } else {
        login(account);
        navigate("/subjects", { replace: true });
      }
    } catch {
      setError("Không đăng nhập được. Hãy kiểm tra JSON Server ở cổng 9000 và thử lại.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="card login-card">
        <div className="card-body">
          <h1 className="h4 text-center mb-4" id="login-title">Sign In</h1>
          <form onSubmit={handleSubmit} aria-labelledby="login-title">
            <fieldset disabled={isSubmitting}>
              <legend className="visually-hidden">Thông tin đăng nhập</legend>
              <div className="mb-3">
                <label htmlFor="login-email" className="visually-hidden">Email</label>
                <input id="login-email" className="form-control" type="email" name="email"
                  placeholder="email of student or lecture" autoComplete="username"
                  value={form.email} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label htmlFor="login-password" className="visually-hidden">Password</label>
                <input id="login-password" className="form-control" type="password" name="password"
                  placeholder="password" autoComplete="current-password"
                  value={form.password} onChange={handleChange} required />
              </div>
            </fieldset>
            {error && <p className="text-danger small" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng nhập..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
