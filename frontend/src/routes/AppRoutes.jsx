import { Routes, Route, Navigate } from 'react-router-dom';
import { getToken, getRole } from '../shared/utils/tokenUtils';

import LoginPage from '../auth/pages/LoginPage';
import RegisterStudentPage from '../auth/pages/RegisterStudentPage';
import UnauthorizedPage from '../auth/pages/UnauthorizedPage';

import adminRoutes from './adminRoutes';
import tutorRoutes from './tutorRoutes';
import studentRoutes from './studentRoutes';

function RootRedirect() {
  const token = getToken();
  const role  = getRole();
  if (!token) return <Navigate to="/login" replace />;
  if (role === 'ADMIN')   return <Navigate to="/admin/dashboard"   replace />;
  if (role === 'TUTOR')   return <Navigate to="/tutor/dashboard"   replace />;
  if (role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/"            element={<RootRedirect />} />
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/register"    element={<RegisterStudentPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {adminRoutes}
      {tutorRoutes}
      {studentRoutes}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
