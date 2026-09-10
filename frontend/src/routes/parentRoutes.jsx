import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import ParentLayout from '../roles/parent/layouts/ParentLayout';
import ParentAttendancePage from '../roles/parent/pages/ParentAttendancePage';

const parentRoutes = (
  <Route
    path="/parent"
    element={
      <ProtectedRoute allowedRoles={['PARENT']}>
        <ParentLayout />
      </ProtectedRoute>
    }
  >
    <Route path="attendance" element={<ParentAttendancePage />} />
  </Route>
);

export default parentRoutes;
