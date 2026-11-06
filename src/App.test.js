import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import App from "./App";
import { SESSION_KEY } from "./contexts/AuthContext";
import { getAccounts } from "./api/accountApi";
import { getSubjects } from "./api/subjectApi";
import { createQuestion, deleteQuestion, getQuestions, updateQuestion } from "./api/questionApi";
import database from "../database2.json";

jest.mock("./api/accountApi", () => ({ getAccounts: jest.fn() }));
jest.mock("./api/subjectApi", () => ({ getSubjects: jest.fn() }));
jest.mock("./api/questionApi", () => ({
  getQuestions: jest.fn(), createQuestion: jest.fn(), updateQuestion: jest.fn(), deleteQuestion: jest.fn(),
}));

let data;
const student = database.accounts.find((account) => account.role === "student");

function CurrentUrl() {
  const location = useLocation();
  return <output data-testid="current-url">{location.pathname}</output>;
}

function renderApp(url = "/login", signedIn = false) {
  if (signedIn) {
    const { password, ...session } = student;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App /><CurrentUrl />
    </MemoryRouter>
  );
}

function submitLogin(email = student.email, password = "123") {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Login" }));
}

function fillQuestion(content = "  New question?  ", options = "Choice A; Choice B\nChoice C; Choice D", answer = "Choice B") {
  fireEvent.change(screen.getByLabelText("Nội dung câu hỏi"), { target: { value: content } });
  fireEvent.change(screen.getByLabelText("Các đáp án"), { target: { value: options } });
  fireEvent.change(screen.getByLabelText("Đáp án đúng"), { target: { value: answer } });
}

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  data = JSON.parse(JSON.stringify(database));
  getAccounts.mockImplementation(async () => data.accounts);
  getSubjects.mockImplementation(async () => data.subjects);
  getQuestions.mockImplementation(async () => [...data.questions]);
  createQuestion.mockImplementation(async (question) => {
    const created = { ...question, id: "generated-id" };
    data.questions.push(created);
    return created;
  });
  updateQuestion.mockImplementation(async (id, question) => {
    const updated = { ...question, id };
    data.questions = data.questions.map((item) => item.id === id ? updated : item);
    return updated;
  });
  deleteQuestion.mockImplementation(async (id) => {
    data.questions = data.questions.filter((question) => question.id !== id);
  });
  jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => jest.restoreAllMocks());

/* ĐĂNG NHẬP VÀ ĐIỀU HƯỚNG */
test.each(["/", "/invalid-url", "/subjects", "/questions/CSD201"])("redirects signed-out users at %s to login", (url) => {
  renderApp(url);
  expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  expect(screen.getByTestId("current-url")).toHaveTextContent(/^\/login$/);
  expect(getSubjects).not.toHaveBeenCalled();
});

test("ignores corrupt saved sessions", () => {
  localStorage.setItem(SESSION_KEY, "invalid JSON");
  renderApp("/subjects");
  expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
});

test("rejects incorrect credentials and masks the password", async () => {
  renderApp();
  expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  submitLogin(student.email, "incorrect");
  expect(await screen.findByRole("alert")).toHaveTextContent("Email hoặc mật khẩu không chính xác.");
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
});

test("denies an Inactive lecturer with the exact red error", async () => {
  data.accounts = data.accounts.map((account) => ({ ...account, status: "Inactive" }));
  renderApp();
  submitLogin("loandt34@fpt.edu.vn");
  const error = await screen.findByRole("alert");
  expect(error).toHaveTextContent(/^Tài khoản đã bị khóa$/);
  expect(error).toHaveClass("text-danger");
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
});

test.each(["student", "lecturer"])("allows an active %s and stores the session without a password", async (role) => {
  data.accounts = [{ ...student, role }];
  renderApp();
  submitLogin(student.email.toUpperCase());
  expect(await screen.findByRole("heading", { name: "Danh sách môn học" })).toBeInTheDocument();
  await screen.findByRole("table");
  expect(screen.getByText(`Hello ${student.email} (${role})`)).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(SESSION_KEY))).toEqual({
    id: student.id, email: student.email, role, status: "active",
  });
});

test("logout clears the session and returns to login", async () => {
  renderApp("/subjects", true);
  await screen.findByRole("table");
  fireEvent.click(screen.getByRole("button", { name: "Logout" }));
  expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
});

/* DANH SÁCH MÔN: ĐẾM THẬT, TÌM THEO MÃ/TÊN VÀ XEM THÔNG TIN */
test("restores the session, counts actual questions and filters codes/names without refetching", async () => {
  renderApp("/subjects", true);
  const table = await screen.findByRole("table");
  const row = within(table).getByText("CSD201").closest("tr");
  expect(within(row).getByText("4")).toBeInTheDocument();
  expect(within(table).getAllByRole("row")).toHaveLength(5);
  fireEvent.change(screen.getByLabelText("Tìm kiếm môn học"), { target: { value: "csd201" } });
  expect(within(table).getAllByRole("row")).toHaveLength(2);
  fireEvent.change(screen.getByLabelText("Tìm kiếm môn học"), { target: { value: "FRONT-END" } });
  expect(within(table).getByText("FER202")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Tìm kiếm môn học"), { target: { value: "missing" } });
  expect(screen.getByText("Không tìm thấy môn học.")).toBeInTheDocument();
  expect(getSubjects).toHaveBeenCalledTimes(1);
  expect(getQuestions).toHaveBeenCalledTimes(1);
});

test("subject info opens a modal with the actual count", async () => {
  renderApp("/subjects", true);
  fireEvent.click(await screen.findByRole("button", { name: "Thông tin: CSD201" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("Data Structures and Algorithms")).toBeInTheDocument();
  expect(within(dialog).getByText("4")).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Đóng" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test.each(["/questions/CSD201", "/question/CSD201"])("opens the correct question set at %s", async (url) => {
  renderApp(url, true);
  const table = await screen.findByRole("table");
  expect(screen.getByRole("heading", { name: "Bộ câu hỏi môn: Data Structures and Algorithms (CSD201)" })).toBeInTheDocument();
  expect(within(table).getAllByRole("row")).toHaveLength(5);
  expect(within(table).getByText("BSTree, AVL, abc, def")).toBeInTheDocument();
  expect(within(table).getByText("BsTree")).toHaveClass("text-success");
  expect(within(table).queryByText("What is JSX?")).not.toBeInTheDocument();
});

/* THÊM/SỬA: KIỂM TRA PAYLOAD VÀ CHỜ API TRƯỚC KHI CẬP NHẬT */
test("creates a question, updates both counts and retains data after reopening the route", async () => {
  renderApp("/questions/CSD201", true);
  fireEvent.click(await screen.findByRole("button", { name: "+ Thêm câu hỏi mới" }));
  fillQuestion();
  fireEvent.click(screen.getByRole("button", { name: "Lưu câu hỏi" }));
  expect(await screen.findByText("Đã thêm câu hỏi mới.")).toBeInTheDocument();
  expect(createQuestion).toHaveBeenCalledWith({
    subjectId: "CSD201", content: "New question?",
    options: ["Choice A", "Choice B", "Choice C", "Choice D"], correctAnswer: "Choice B",
  });
  expect(screen.getByText(/Tổng số câu hỏi:/)).toHaveTextContent("Tổng số câu hỏi: 5");
  fireEvent.click(screen.getByRole("link", { name: "Quay lại danh sách môn" }));
  const row = (await screen.findByText("CSD201")).closest("tr");
  expect(within(row).getByText("5")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Truy cập bộ câu hỏi: CSD201" }));
  expect(await screen.findByText("New question?")).toBeInTheDocument();
});

test("preloads and updates the legacy question with a valid options array and matching answer", async () => {
  renderApp("/questions/CSD201", true);
  fireEvent.click(await screen.findByRole("button", { name: "Sửa: What is tree?" }));
  expect(screen.getByLabelText("Các đáp án")).toHaveValue("BSTree\nAVL\nabc\ndef");
  expect(screen.getByLabelText("Đáp án đúng")).toHaveValue("BSTree");
  fireEvent.change(screen.getByLabelText("Nội dung câu hỏi"), { target: { value: "Updated tree question?" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu câu hỏi" }));
  expect(await screen.findByText("Đã cập nhật câu hỏi.")).toBeInTheDocument();
  expect(updateQuestion).toHaveBeenCalledWith("C8Z0u3xbqVQ", {
    subjectId: "CSD201", content: "Updated tree question?",
    options: ["BSTree", "AVL", "abc", "def"], correctAnswer: "BSTree",
  });
  expect(screen.getByText(/Tổng số câu hỏi:/)).toHaveTextContent("Tổng số câu hỏi: 4");
});

test.each([
  ["   ", "A; B", "A", "Vui lòng nhập nội dung câu hỏi."],
  ["Question?", "A", "A", "Vui lòng nhập ít nhất 2 đáp án."],
  ["Question?", "A; a", "A", "Các đáp án không được trùng nhau."],
  ["Question?", "A; B", "", "Vui lòng chọn đáp án đúng trong các đáp án."],
])("validates question inputs before writing: %s / %s", async (content, options, answer, error) => {
  renderApp("/questions/CSD201", true);
  fireEvent.click(await screen.findByRole("button", { name: "+ Thêm câu hỏi mới" }));
  fillQuestion(content, options, answer);
  fireEvent.click(screen.getByRole("button", { name: "Lưu câu hỏi" }));
  expect(screen.getByRole("alert")).toHaveTextContent(error);
  expect(createQuestion).not.toHaveBeenCalled();
  expect(updateQuestion).not.toHaveBeenCalled();
});

test("locks a pending save and keeps values after a failed save for retry", async () => {
  let rejectSave;
  createQuestion.mockReturnValueOnce(new Promise((resolve, reject) => { rejectSave = reject; }));
  renderApp("/questions/CSD201", true);
  fireEvent.click(await screen.findByRole("button", { name: "+ Thêm câu hỏi mới" }));
  fillQuestion();
  fireEvent.click(screen.getByRole("button", { name: "Lưu câu hỏi" }));
  expect(screen.getByRole("button", { name: "Đang lưu..." })).toBeDisabled();
  expect(screen.getByLabelText("Nội dung câu hỏi")).toBeDisabled();
  fireEvent.submit(screen.getByRole("form", { name: "Thêm câu hỏi mới" }));
  expect(createQuestion).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Tổng số câu hỏi:/)).toHaveTextContent("Tổng số câu hỏi: 4");
  await act(async () => rejectSave(new Error("offline")));
  expect(screen.getByRole("alert")).toHaveTextContent("Không lưu được câu hỏi");
  expect(screen.getByLabelText("Nội dung câu hỏi")).toHaveValue("  New question?  ");
  fireEvent.click(screen.getByRole("button", { name: "Lưu câu hỏi" }));
  expect(await screen.findByText("Đã thêm câu hỏi mới.")).toBeInTheDocument();
});

/* XÓA: XÁC NHẬN, CHỜ PHẢN HỒI VÀ GIỮ DÒNG KHI LỖI */
test("canceling confirmation does not delete or change the count", async () => {
  window.confirm.mockReturnValue(false);
  renderApp("/questions/CSD201", true);
  fireEvent.click(await screen.findByRole("button", { name: "Xóa: What is tree?" }));
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("What is tree?"));
  expect(deleteQuestion).not.toHaveBeenCalled();
  expect(screen.getByText("What is tree?")).toBeInTheDocument();
});

test("waits for DELETE success, then updates the row and count", async () => {
  let finishDelete;
  deleteQuestion.mockReturnValueOnce(new Promise((resolve) => { finishDelete = resolve; }));
  renderApp("/questions/CSD201", true);
  fireEvent.click(await screen.findByRole("button", { name: "Xóa: What is tree?" }));
  expect(screen.getByText("What is tree?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Xóa: What is tree?" })).toBeDisabled();
  await act(async () => finishDelete());
  expect(screen.queryByText("What is tree?")).not.toBeInTheDocument();
  expect(screen.getByText(/Tổng số câu hỏi:/)).toHaveTextContent("Tổng số câu hỏi: 3");
});

test("a failed DELETE preserves the question and re-enables actions", async () => {
  deleteQuestion.mockRejectedValueOnce(new Error("offline"));
  renderApp("/questions/CSD201", true);
  fireEvent.click(await screen.findByRole("button", { name: "Xóa: What is tree?" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Không xóa được câu hỏi");
  expect(screen.getByText("What is tree?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Xóa: What is tree?" })).toBeEnabled();
});

test("a failed data request offers retry instead of displaying an empty table", async () => {
  getQuestions.mockRejectedValueOnce(new Error("offline"));
  renderApp("/subjects", true);
  expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được dữ liệu");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByRole("table")).toBeInTheDocument();
});

test("handles a missing subject with a way back", async () => {
  renderApp("/questions/missing", true);
  expect(await screen.findByRole("alert")).toHaveTextContent("Không tìm thấy môn học có mã missing.");
  expect(screen.getByRole("link", { name: "Quay lại danh sách môn" })).toHaveAttribute("href", "/subjects");
});
