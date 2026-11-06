import { createContext, useContext, useEffect, useState } from "react";

export const SESSION_KEY = "exam-management-user";
const AuthContext = createContext(null);

/* KHÔI PHỤC PHIÊN: chỉ nhận thông tin active và vai trò có trong đề bài. */
function readSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (saved?.id && typeof saved.email === "string" &&
      ["student", "lecturer"].includes(saved.role) && saved.status === "active") {
      return saved;
    }
  } catch {
    // Dữ liệu phiên bị lỗi được xem như chưa đăng nhập.
  }
  return null;
}

/* NGỮ CẢNH ĐĂNG NHẬP: chia sẻ phiên cho các trang, đồng bộ khi logout ở tab khác. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  useEffect(() => {
    function syncSession(event) {
      if (event.key === SESSION_KEY || event.key === null) setUser(readSession());
    }
    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, []);

  /* LƯU PHIÊN: chỉ lưu thông tin người dùng, không đưa mật khẩu vào localStorage. */
  function login(account) {
    const session = {
      id: account.id, email: account.email,
      role: account.role.toLowerCase(), status: account.status.toLowerCase(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
