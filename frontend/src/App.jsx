import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import ClientDashboard from "./pages/client/ClientDashboard";
import useAuthStore from "./store/authStore";
import { getRoleDefaultRoute } from "./utils/roleRoutes";

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>

        {/* Public route — login */}
        <Route
          path="/login"
          element={
            // If already logged in, redirect to role dashboard
            isAuthenticated && user
              ? <Navigate to={getRoleDefaultRoute(user.role)} replace />
              : <LoginPage />
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Recruiter routes */}
        <Route
          path="/recruiter/*"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <Routes>
                <Route path="dashboard" element={<RecruiterDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Vendor routes */}
        <Route
          path="/vendor/*"
          element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <Routes>
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Client routes */}
        <Route
          path="/client/*"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <Routes>
                <Route path="dashboard" element={<ClientDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            isAuthenticated && user
              ? <Navigate to={getRoleDefaultRoute(user.role)} replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Catch all — redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}