import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import StudentLayout from '../roles/student/layouts/StudentLayout';

import StudentDashboardPage from '../roles/student/pages/StudentDashboardPage';
import StudentEnrollmentsPage from '../roles/student/pages/StudentEnrollmentsPage';
import StudentPaymentsPage from '../roles/student/pages/StudentPaymentsPage';
import StudentEnrollmentHistoryPage from '../roles/student/pages/StudentEnrollmentHistoryPage';
import StudentProfilePage from '../roles/student/pages/StudentProfilePage';
import StudentMyCoursesPage from "../roles/student/pages/StudentMyCoursesPage";
import StudentExamSchedulePage from '../roles/student/pages/StudentExamSchedulePage';
import StudentExamCourseDetailPage from '../roles/student/pages/StudentExamCourseDetailPage';
import StudentCourseEvaluationPage from '../roles/student/pages/StudentCourseEvaluationPage';

const studentRoutes = (
  <Route
  path="/student"
  element={
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout />
    </ProtectedRoute>
  }
>
  <Route path="dashboard" element={<StudentDashboardPage />} />
  <Route path="enrollments" element={<StudentEnrollmentsPage />} />
  <Route path="payments" element={<StudentPaymentsPage />} />
  <Route path="enrollment-history" element={<StudentEnrollmentHistoryPage />} />
  <Route path="profile" element={<StudentProfilePage />} />
  <Route path="courses" element={<StudentMyCoursesPage />} />
  <Route path="exam-schedule" element={<StudentExamSchedulePage />} />
  <Route path="exam-schedule/:courseId" element={<StudentExamCourseDetailPage />} />
  <Route path="course-evaluations" element={<StudentCourseEvaluationPage />} />
  {/* เส้นทางเดิม — คงไว้กันลิงก์เก่า/บุ๊กมาร์กพัง (ตารางเรียน/การเข้าเรียน/ผลสอบในระบบถูกถอดออกแล้ว) */}
  <Route path="schedule" element={<Navigate to="/student/dashboard" replace />} />
  <Route path="attendance" element={<Navigate to="/student/dashboard" replace />} />
  <Route path="exam-results" element={<Navigate to="/student/dashboard" replace />} />
  <Route path="exams/:examId/take" element={<Navigate to="/student/exam-schedule" replace />} />
</Route>
);

export default studentRoutes;
