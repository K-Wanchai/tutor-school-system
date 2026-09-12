import { Route, Navigate } from 'react-router-dom';
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
import AdminReportsPage from '../roles/admin/pages/AdminReportsPage';

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
    <Route path="student-exam-achievements" element={<StudentExamAchievementManagePage />} />
    <Route path="student-exam-achievements/:achievementId/detail" element={<StudentAchievementDetailPage />} />
    <Route path="reports" element={<AdminReportsPage />} />
    <Route path="settings" element={<AdminSettingsPage />} />
    {/* เส้นทางเดิม — คงไว้กันลิงก์เก่า/บุ๊กมาร์กพัง (การเช็คชื่อ/ตารางเรียนถูกถอดออกแล้ว) */}
    <Route path="attendance" element={<Navigate to="/admin/dashboard" replace />} />
  </Route>
);

export default adminRoutes;
