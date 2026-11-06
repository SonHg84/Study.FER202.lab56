import { useEffect, useState } from "react";
import { getSubjects } from "../api/subjectApi";
import { getQuestions } from "../api/questionApi";

/* HOOK DỮ LIỆU: tải môn và câu hỏi; cùng một nguồn dữ liệu để tính số câu. */
export default function useSubjectData() {
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    setIsLoading(true);
    setError("");
    Promise.all([getSubjects(options), getQuestions(options)])
      .then(([subjectData, questionData]) => {
        if (!controller.signal.aborted) {
          setSubjects(subjectData);
          setQuestions(questionData);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Không tải được dữ liệu. Hãy kiểm tra JSON Server ở cổng 9000.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  return {
    subjects, questions, setQuestions, isLoading, error,
    reload: () => setReloadKey((current) => current + 1),
  };
}
