import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { Role } from '@/types';
import { Toaster } from '@/components/ui/toaster';

// Admin Pages
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminVendorsPage from '@/pages/admin/AdminVendorsPage';

// Shared JD Pages
import JDListPage from '@/pages/jds/JDListPage';
import JDDetailPage from '@/pages/jds/JDDetailPage';

// Vendor Pages
import VendorJDsPage from '@/pages/vendor/VendorJDsPage';
import VendorJDDetailPage from '@/pages/vendor/VendorJDDetailPage';
import VendorSubmissionsPage from '@/pages/vendor/VendorSubmissionsPage';

// 404
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes — inside AppShell */}
        <Route element={<AppShell />}>
          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={[Role.Admin]} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/vendors" element={<AdminVendorsPage />} />
            <Route path="/admin/jds" element={<JDListPage />} />
            <Route path="/admin/jds/:id" element={<JDDetailPage />} />
          </Route>

          {/* Recruiter Routes */}
          <Route element={<ProtectedRoute allowedRoles={[Role.Recruiter]} />}>
            <Route path="/recruiter/jds" element={<JDListPage />} />
            <Route path="/recruiter/jds/:id" element={<JDDetailPage />} />
          </Route>

          {/* Vendor Routes */}
          <Route element={<ProtectedRoute allowedRoles={[Role.Vendor]} />}>
            <Route path="/vendor/jds" element={<VendorJDsPage />} />
            <Route path="/vendor/jds/:id" element={<VendorJDDetailPage />} />
            <Route path="/vendor/submissions" element={<VendorSubmissionsPage />} />
          </Route>
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  );
}
