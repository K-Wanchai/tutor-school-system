import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import StudentLayout from '../roles/student/layouts/StudentLayout';

import StudentDashboardPage from '../roles/student/pages/StudentDashboardPage';
import StudentEnrollmentsPage from '../roles/student/pages/StudentEnrollmentsPage';
import StudentPaymentsPage from '../roles/student/pages/StudentPaymentsPage';
import StudentEnrollmentHistoryPage from '../roles/student/pages/StudentEnrollmentHistoryPage';
import StudentProfilePage from '../roles/student/pages/StudentProfilePage';
import StudentMyCoursesPage from "../roles/student/pages/StudentMyCoursesPage";
import StudentCourseHistoryPage from '../roles/student/pages/StudentCourseHistoryPage';
import StudentExamSchedulePage from '../roles/student/pages/StudentExamSchedulePage';
import StudentExamCourseDetailPage from '../roles/student/pages/StudentExamCourseDetailPage';
import StudentCourseEvaluationPage from '../roles/student/pages/StudentCourseEvaluationPage';
import StudentAttendancePage from '../roles/student/pages/StudentAttendancePage';
import StudentAttendanceCoursePage from '../roles/student/pages/StudentAttendanceCoursePage';
import StudentExamResultsPage from '../roles/student/pages/StudentExamResultsPage';
import StudentExamResultsCoursePage from '../roles/student/pages/StudentExamResultsCoursePage';

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
  <Route path="course-history" element={<StudentCourseHistoryPage />} />
  <Route path="exam-schedule" element={<StudentExamSchedulePage />} />
  <Route path="exam-schedule/:courseId" element={<StudentExamCourseDetailPage />} />
  <Route path="course-evaluations" element={<StudentCourseEvaluationPage />} />
  <Route path="attendance" element={<StudentAttendancePage />} />
  <Route path="attendance/:courseId" element={<StudentAttendanceCoursePage />} />
  <Route path="exam-results" element={<StudentExamResultsPage />} />
  <Route path="exam-results/:courseId" element={<StudentExamResultsCoursePage />} />
  {/* เส้นทางเดิม — คงไว้กันลิงก์เก่า/บุ๊กมาร์กพัง (ตารางเรียนในระบบถูกถอดออกแล้ว) */}
  <Route path="schedule" element={<Navigate to="/student/dashboard" replace />} />
  <Route path="exams/:examId/take" element={<Navigate to="/student/exam-schedule" replace />} />
</Route>
);

export default studentRoutes;
