import { Routes, Route, Navigate } from 'react-router-dom';
import { getToken, getRole } from '../shared/utils/tokenUtils';

import LandingPage from '../auth/pages/LandingPage';
import LoginPage from '../auth/pages/LoginPage';
import ParentLoginPage from '../auth/pages/ParentLoginPage';
import RegisterStudentPage from '../auth/pages/RegisterStudentPage';
import UnauthorizedPage from '../auth/pages/UnauthorizedPage';
import ForgotPasswordPage from '../auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../auth/pages/ResetPasswordPage';

import adminRoutes from './adminRoutes';
import tutorRoutes from './tutorRoutes';
import studentRoutes from './studentRoutes';
import parentRoutes from './parentRoutes';

function RootRedirect() {
  const token = getToken();
  const role  = getRole();
  if (!token) return <LandingPage />;
  if (role === 'ADMIN')   return <Navigate to="/admin/dashboard"   replace />;
  if (role === 'TUTOR')   return <Navigate to="/tutor/dashboard"   replace />;
  if (role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
  if (role === 'PARENT')  return <Navigate to="/parent/attendance"  replace />;
  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/"            element={<RootRedirect />} />
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/parent-login" element={<ParentLoginPage />} />
      <Route path="/register"    element={<RegisterStudentPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {adminRoutes}
      {tutorRoutes}
      {studentRoutes}
      {parentRoutes}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
