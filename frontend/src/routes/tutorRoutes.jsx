import { Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import TutorLayout from '../roles/tutor/layouts/TutorLayout';
import TutorDashboardPage from '../roles/tutor/pages/TutorDashboardPage';
import TutorCoursesPage from '../roles/tutor/pages/TutorCoursesPage';
import TutorNotificationsPage from '../roles/tutor/pages/TutorNotificationsPage';
import TutorSchedulesPage from '../roles/tutor/pages/TutorSchedulesPage';
import TutorExamSchedulePage from '../roles/tutor/pages/TutorExamSchedulePage';
import TutorExamCourseDetailPage from '../roles/tutor/pages/TutorExamCourseDetailPage';
import TutorExamBuilderPage from '../roles/tutor/pages/TutorExamBuilderPage';
import TutorExamGradingPage from '../roles/tutor/pages/TutorExamGradingPage';
import TutorExamScoresPage from '../roles/tutor/pages/TutorExamScoresPage';
import TutorExamScoreCoursePage from '../roles/tutor/pages/TutorExamScoreCoursePage';
import TutorAttendancePage from '../roles/tutor/pages/TutorAttendancePage';
import TutorAttendanceDetailPage from '../roles/tutor/pages/TutorAttendanceDetailPage';
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
    <Route path="courses" element={<TutorCoursesPage />} />
    <Route path="notifications" element={<TutorNotificationsPage />} />
    <Route path="schedule" element={<TutorSchedulesPage />} />
    <Route path="exam-schedule" element={<TutorExamSchedulePage />} />
    <Route path="exam-schedule/:courseId" element={<TutorExamCourseDetailPage />} />
    <Route path="exams/:examId/build" element={<TutorExamBuilderPage />} />
    <Route path="exams/:examId/grading" element={<TutorExamGradingPage />} />
    <Route path="exam-scores" element={<TutorExamScoresPage />} />
    <Route path="exam-scores/:courseId" element={<TutorExamScoreCoursePage />} />
    <Route path="attendance" element={<TutorAttendancePage />} />
    <Route path="attendance/:courseId" element={<TutorAttendanceDetailPage />} />
    <Route path="classroom" element={<TutorClassroomsPage />} />
    <Route path="evaluations" element={<TutorEvaluationsPage />} />
    <Route path="profile" element={<TutorProfilePage />} />
  </Route>
);

export default tutorRoutes;
