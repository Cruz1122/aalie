import { redirect } from "next/navigation";

export default function CourseQuizPage() {
  // Legacy route — now redirects to the new /quizzes dashboard
  redirect("/quizzes");
}
