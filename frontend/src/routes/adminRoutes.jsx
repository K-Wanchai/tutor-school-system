import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../roles/admin/layouts/AdminLayout';
import AdminDashboardPage from '../roles/admin/pages/AdminDashboardPage';
import AdminStudentManagementPage from '../roles/admin/pages/AdminStudentManagementPage';
import AdminTutorManagementPage from '../roles/admin/pages/AdminTutorManagementPage';
import AdminCourseManagementPage from '../roles/admin/pages/AdminCourseManagementPage';
import AdminCourseCreatePage from '../roles/admin/pages/AdminCourseCreatePage';
import AdminSettingsPage from '../roles/admin/pages/AdminSettingsPage';
import AdminEnrollmentManagementPage from '../roles/admin/pages/AdminEnrollmentManagementPage';
import AdminPaymentManagementPage from '../roles/admin/pages/AdminPaymentManagementPage';
import ExamInstitutionManagePage from '../roles/admin/pages/ExamInstitutionManagePage';
import ExamInstitutionDetailPage from '../roles/admin/pages/ExamInstitutionDetailPage';
import StudentExamAchievementManagePage from '../roles/admin/pages/StudentExamAchievementManagePage';
import StudentAchievementDetailPage from '../roles/admin/pages/StudentAchievementDetailPage';
import AdminExamTutorListPage from '../roles/admin/pages/AdminExamTutorListPage';
import AdminExamTutorCoursesPage from '../roles/admin/pages/AdminExamTutorCoursesPage';
import AdminExamCourseScoresPage from '../roles/admin/pages/AdminExamCourseScoresPage';
import AdminAttendanceTutorListPage from '../roles/admin/pages/AdminAttendanceTutorListPage';
import AdminAttendanceTutorCoursesPage from '../roles/admin/pages/AdminAttendanceTutorCoursesPage';
import AdminAttendanceCoursePage from '../roles/admin/pages/AdminAttendanceCoursePage';

const adminRoutes = (
  <Route
    path="/admin"
    element={
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    <Route path="dashboard" element={<AdminDashboardPage />} />
    <Route path="students" element={<AdminStudentManagementPage />} />
    <Route path="tutors" element={<AdminTutorManagementPage />} />
    <Route path="courses" element={<AdminCourseManagementPage />} />
    <Route path="courses/create" element={<AdminCourseCreatePage />} />
    <Route path="enrollments" element={<AdminEnrollmentManagementPage />} />
    <Route path="payments" element={<AdminPaymentManagementPage />} />
    <Route path="exam-institutions" element={<ExamInstitutionManagePage />} />
    <Route path="exam-institutions/:institutionId" element={<ExamInstitutionDetailPage />} />
    <Route path="exams" element={<AdminExamTutorListPage />} />
    <Route path="exams/tutors/:tutorId" element={<AdminExamTutorCoursesPage />} />
    <Route path="exams/tutors/:tutorId/courses/:courseId" element={<AdminExamCourseScoresPage />} />
    <Route path="attendance" element={<AdminAttendanceTutorListPage />} />
    <Route path="attendance/tutors/:tutorId" element={<AdminAttendanceTutorCoursesPage />} />
    <Route path="attendance/tutors/:tutorId/courses/:courseId" element={<AdminAttendanceCoursePage />} />
    <Route path="student-exam-achievements" element={<StudentExamAchievementManagePage />} />
    <Route path="student-exam-achievements/:achievementId/detail" element={<StudentAchievementDetailPage />} />
    <Route path="settings" element={<AdminSettingsPage />} />
  </Route>
);

export default adminRoutes;
