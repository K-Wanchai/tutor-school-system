import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import StudentLayout from '../roles/student/layouts/StudentLayout';

import StudentDashboardPage from '../roles/student/pages/StudentDashboardPage';
import StudentEnrollmentsPage from '../roles/student/pages/StudentEnrollmentsPage';
import StudentPaymentsPage from '../roles/student/pages/StudentPaymentsPage';
import StudentEnrollmentHistoryPage from '../roles/student/pages/StudentEnrollmentHistoryPage';

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

    {/* เพิ่มตรงนี้ */}
    <Route path="enrollments" element={<StudentEnrollmentsPage />} />
    <Route path="payments" element={<StudentPaymentsPage />} />
    <Route path="enrollment-history" element={<StudentEnrollmentHistoryPage />} />
  </Route>
);

export default studentRoutes;