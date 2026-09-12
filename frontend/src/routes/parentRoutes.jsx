import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import ParentLayout from '../roles/parent/layouts/ParentLayout';
import ParentDashboardPage from '../roles/parent/pages/ParentDashboardPage';
import ParentEnrollmentHistoryPage from '../roles/parent/pages/ParentEnrollmentHistoryPage';
import ParentProfilePage from '../roles/parent/pages/ParentProfilePage';

const parentRoutes = (
  <Route
    path="/parent"
    element={
      <ProtectedRoute allowedRoles={['PARENT']}>
        <ParentLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<Navigate to="/parent/dashboard" replace />} />
    <Route path="dashboard" element={<ParentDashboardPage />} />
    <Route path="enrollment-history" element={<ParentEnrollmentHistoryPage />} />
    <Route path="profile" element={<ParentProfilePage />} />
    {/* เส้นทางเดิม — คงไว้กันลิงก์เก่า/บุ๊กมาร์กพัง */}
    <Route path="tracking" element={<Navigate to="/parent/dashboard" replace />} />
    <Route path="schedule" element={<Navigate to="/parent/dashboard" replace />} />
    <Route path="exam-results" element={<Navigate to="/parent/dashboard" replace />} />
    <Route path="attendance" element={<Navigate to="/parent/dashboard" replace />} />
  </Route>
);

export default parentRoutes;
