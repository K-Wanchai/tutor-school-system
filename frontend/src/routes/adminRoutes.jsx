import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../roles/admin/layouts/AdminLayout';
import AdminDashboardPage from '../roles/admin/pages/AdminDashboardPage';
import AdminStudentManagementPage from '../roles/admin/pages/AdminStudentManagementPage';
import AdminTutorManagementPage from '../roles/admin/pages/AdminTutorManagementPage';
import AdminCourseManagementPage from '../roles/admin/pages/AdminCourseManagementPage';

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
  </Route>
);

export default adminRoutes;
