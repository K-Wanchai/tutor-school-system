import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import TutorLayout from '../roles/tutor/layouts/TutorLayout';
import TutorDashboardPage from '../roles/tutor/pages/TutorDashboardPage';
import TutorNewCoursesPage from '../roles/tutor/pages/TutorNewCoursesPage';
import TutorCoursesPage from '../roles/tutor/pages/TutorCoursesPage';
import TutorNotificationsPage from '../roles/tutor/pages/TutorNotificationsPage';
import TutorSchedulesPage from '../roles/tutor/pages/TutorSchedulesPage';
import TutorAttendanceScoresPage from '../roles/tutor/pages/TutorAttendanceScoresPage';
import TutorAttendanceScoreDetailPage from '../roles/tutor/pages/TutorAttendanceScoreDetailPage';
import TutorClassroomsPage from '../roles/tutor/pages/TutorClassroomsPage';
import TutorEvaluationsPage from '../roles/tutor/pages/TutorEvaluationsPage';
import TutorProfilePage from '../roles/tutor/pages/TutorProfilePage';

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
    <Route path="new-courses" element={<TutorNewCoursesPage />} />
    <Route path="courses" element={<TutorCoursesPage />} />
    <Route path="notifications" element={<TutorNotificationsPage />} />
    <Route path="schedule" element={<TutorSchedulesPage />} />
    <Route path="attendance-scores" element={<TutorAttendanceScoresPage />} />
    <Route path="attendance-scores/:courseId" element={<TutorAttendanceScoreDetailPage />} />
    <Route path="classroom" element={<TutorClassroomsPage />} />
    <Route path="evaluations" element={<TutorEvaluationsPage />} />
    <Route path="profile" element={<TutorProfilePage />} />
  </Route>
);

export default tutorRoutes;
