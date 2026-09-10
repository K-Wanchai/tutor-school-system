import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import ParentLayout from '../roles/parent/layouts/ParentLayout';
import ParentTrackingPage from '../roles/parent/pages/ParentTrackingPage';

const parentRoutes = (
  <Route
    path="/parent"
    element={
      <ProtectedRoute allowedRoles={['PARENT']}>
        <ParentLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<ParentTrackingPage />} />
    <Route path="tracking" element={<ParentTrackingPage />} />
    <Route path="attendance" element={<Navigate to="/parent" replace />} />
  </Route>
);

export default parentRoutes;
