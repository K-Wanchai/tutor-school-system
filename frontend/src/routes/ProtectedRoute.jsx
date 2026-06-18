import { Navigate } from 'react-router-dom';
import { getToken, getRole } from '../shared/utils/tokenUtils';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const role = getRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
