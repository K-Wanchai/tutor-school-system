import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import TutorLayout from '../roles/tutor/layouts/TutorLayout';
import TutorDashboardPage from '../roles/tutor/pages/TutorDashboardPage';
import TutorCoursesPage from '../roles/tutor/pages/TutorCoursesPage';
import TutorNotificationsPage from '../roles/tutor/pages/TutorNotificationsPage';
import TutorExamSchedulePage from '../roles/tutor/pages/TutorExamSchedulePage';
import TutorExamCourseDetailPage from '../roles/tutor/pages/TutorExamCourseDetailPage';
import TutorExamScoresPage from '../roles/tutor/pages/TutorExamScoresPage';
import TutorExamScoreCoursePage from '../roles/tutor/pages/TutorExamScoreCoursePage';
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
    <Route path="exam-schedule" element={<TutorExamSchedulePage />} />
    <Route path="exam-schedule/:courseId" element={<TutorExamCourseDetailPage />} />
    <Route path="exam-scores" element={<TutorExamScoresPage />} />
    <Route path="exam-scores/:courseId" element={<TutorExamScoreCoursePage />} />
    <Route path="evaluations" element={<TutorEvaluationsPage />} />
    <Route path="profile" element={<TutorProfilePage />} />
    {/* เส้นทางเดิม — คงไว้กันลิงก์เก่า/บุ๊กมาร์กพัง (ตารางเรียน/การเข้าเรียน/ทำข้อสอบในระบบถูกถอดออกแล้ว) */}
    <Route path="schedule" element={<Navigate to="/tutor/dashboard" replace />} />
    <Route path="attendance" element={<Navigate to="/tutor/dashboard" replace />} />
    <Route path="attendance/:courseId" element={<Navigate to="/tutor/dashboard" replace />} />
    <Route path="exams/:examId/build" element={<Navigate to="/tutor/exam-schedule" replace />} />
    <Route path="exams/:examId/grading" element={<Navigate to="/tutor/exam-schedule" replace />} />
  </Route>
);

export default tutorRoutes;
