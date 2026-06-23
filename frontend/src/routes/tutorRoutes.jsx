import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import TutorLayout from '../roles/tutor/layouts/TutorLayout';
import TutorDashboardPage from '../roles/tutor/pages/TutorDashboardPage';
import TutorCoursesPage from '../roles/tutor/pages/TutorCoursesPage';

const tutorRoutes = (
  <Route
    path="/tutor"
    element={
      <ProtectedRoute allowedRoles={['TUTOR']}>
        <TutorLayout />
      </ProtectedRoute>
    }
  >
    <Route path="dashboard" element={<TutorDashboardPage />} />
    <Route path="courses" element={<TutorCoursesPage />} />
  </Route>
);

export default tutorRoutes;
