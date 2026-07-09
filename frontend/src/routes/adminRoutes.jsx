import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../roles/admin/layouts/AdminLayout';
import AdminDashboardPage from '../roles/admin/pages/AdminDashboardPage';
import AdminStudentManagementPage from '../roles/admin/pages/AdminStudentManagementPage';
import AdminTutorManagementPage from '../roles/admin/pages/AdminTutorManagementPage';
import AdminCourseManagementPage from '../roles/admin/pages/AdminCourseManagementPage';
import AdminSettingsPage from '../roles/admin/pages/AdminSettingsPage';
import AdminEnrollmentManagementPage from '../roles/admin/pages/AdminEnrollmentManagementPage';
import AdminPaymentManagementPage from '../roles/admin/pages/AdminPaymentManagementPage';
import ExamInstitutionManagePage from '../roles/admin/pages/ExamInstitutionManagePage';
import ExamInstitutionDetailPage from '../roles/admin/pages/ExamInstitutionDetailPage';
import StudentAchievementDetailPage from '../roles/admin/pages/StudentAchievementDetailPage';

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
    <Route path="enrollments" element={<AdminEnrollmentManagementPage />} />
    <Route path="payments" element={<AdminPaymentManagementPage />} />
    <Route path="exam-institutions" element={<ExamInstitutionManagePage />} />
    <Route path="exam-institutions/:institutionId" element={<ExamInstitutionDetailPage />} />
    <Route path="student-exam-achievements/:achievementId/detail" element={<StudentAchievementDetailPage />} />
    <Route path="settings" element={<AdminSettingsPage />} />
  </Route>
);

export default adminRoutes;
