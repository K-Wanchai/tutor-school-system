import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import StudentLayout from '../roles/student/layouts/StudentLayout';
import StudentDashboardPage from '../roles/student/pages/StudentDashboardPage';

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
  </Route>
);

export default studentRoutes;
