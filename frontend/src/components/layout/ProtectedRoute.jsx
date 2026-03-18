import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { getRoleDefaultRoute } from "../../utils/roleRoutes";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Not logged in → redirect to login, remember where they were going
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their correct dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleDefaultRoute(user.role)} replace />;
  }

  return children;
}