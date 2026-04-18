import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const handleGoHome = () => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    switch (user.role) {
      case Role.Admin: navigate('/admin/users'); break;
      case Role.Recruiter: navigate('/recruiter/jds'); break;
      case Role.Vendor: navigate('/vendor/jds'); break;
      default: navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="space-y-2">
          <p className="text-8xl font-black text-primary/20 select-none">404</p>
          <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button onClick={handleGoHome} size="lg">
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>
    </div>
  );
}
