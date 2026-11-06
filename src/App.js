import "./App.css";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import SubjectsPage from "./pages/SubjectsPage";
import QuestionsPage from "./pages/QuestionsPage";

/* CHẶN TRUY CẬP: các trang dữ liệu yêu cầu có phiên đăng nhập hợp lệ. */
function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/* ĐỊNH TUYẾN: URL gốc và đường dẫn không hợp lệ đều chuyển về /login. */
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/syllabus" element={<Navigate to="/subjects" replace />} />
            <Route path="/questions/:subjectId" element={<QuestionsPage />} />
            <Route path="/question/:subjectId" element={<QuestionsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
