import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import ParentLayout from '../roles/parent/layouts/ParentLayout';
import ParentDashboardPage from '../roles/parent/pages/ParentDashboardPage';
import ParentEnrollmentHistoryPage from '../roles/parent/pages/ParentEnrollmentHistoryPage';
import ParentSchedulePage from '../roles/parent/pages/ParentSchedulePage';
import ParentExamResultsPage from '../roles/parent/pages/ParentExamResultsPage';
import ParentAttendancePage from '../roles/parent/pages/ParentAttendancePage';
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
    <Route path="schedule" element={<ParentSchedulePage />} />
    <Route path="exam-results" element={<ParentExamResultsPage />} />
    <Route path="attendance" element={<ParentAttendancePage />} />
    <Route path="profile" element={<ParentProfilePage />} />
    {/* เส้นทางเดิม — คงไว้กันลิงก์เก่า/บุ๊กมาร์กพัง */}
    <Route path="tracking" element={<Navigate to="/parent/dashboard" replace />} />
  </Route>
);

export default parentRoutes;
