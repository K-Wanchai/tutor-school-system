import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import StudentLayout from '../roles/student/layouts/StudentLayout';

import StudentDashboardPage from '../roles/student/pages/StudentDashboardPage';
import StudentEnrollmentsPage from '../roles/student/pages/StudentEnrollmentsPage';
import StudentPaymentsPage from '../roles/student/pages/StudentPaymentsPage';
import StudentEnrollmentHistoryPage from '../roles/student/pages/StudentEnrollmentHistoryPage';
import StudentProfilePage from '../roles/student/pages/StudentProfilePage';
import StudentMyCoursesPage from "../roles/student/pages/StudentMyCoursesPage";
import StudentSchedulePage from '../roles/student/pages/StudentSchedulePage';
import StudentExamSchedulePage from '../roles/student/pages/StudentExamSchedulePage';
import StudentExamTakePage from '../roles/student/pages/StudentExamTakePage';
import StudentExamResultsPage from '../roles/student/pages/StudentExamResultsPage';
import StudentAttendancePage from '../roles/student/pages/StudentAttendancePage';

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
  <Route path="schedule" element={<StudentSchedulePage />} />
  <Route path="exam-schedule" element={<StudentExamSchedulePage />} />
  <Route path="exams/:examId/take" element={<StudentExamTakePage />} />
  <Route path="exam-results" element={<StudentExamResultsPage />} />
  <Route path="attendance" element={<StudentAttendancePage />} />
</Route>
);

export default studentRoutes;