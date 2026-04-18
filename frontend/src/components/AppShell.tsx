import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import { LogOut, Users, Briefcase, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AppShell: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = () => {
    clearAuth();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-primary">RecruitFlow</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {user.role === Role.Admin && (
            <>
              <SidebarLink to="/admin/users" icon={<Users className="w-5 h-5" />} label="Users" />
              <SidebarLink to="/admin/vendors" icon={<Building2 className="w-5 h-5" />} label="Vendors" />
              <SidebarLink to="/admin/jds" icon={<Briefcase className="w-5 h-5" />} label="Job Descriptions" />
            </>
          )}
          {user.role === Role.Recruiter && (
            <SidebarLink to="/recruiter/jds" icon={<Briefcase className="w-5 h-5" />} label="Job Descriptions" />
          )}
          {user.role === Role.Vendor && (
            <>
              <SidebarLink to="/vendor/jds" icon={<Briefcase className="w-5 h-5" />} label="Job Descriptions" />
              <SidebarLink to="/vendor/submissions" icon={<FileText className="w-5 h-5" />} label="My Submissions" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

function SidebarLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`
      }
    >
      <span className="mr-3">{icon}</span>
      {label}
    </NavLink>
  );
}
