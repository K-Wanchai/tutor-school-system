import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../roles/admin/layouts/AdminLayout';
import AdminDashboardPage from '../roles/admin/pages/AdminDashboardPage';
import AdminStudentManagementPage from '../roles/admin/pages/AdminStudentManagementPage';

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
  </Route>
);

export default adminRoutes;
