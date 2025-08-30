import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export const AuthGuard = ({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  redirectTo = '/login' 
}: AuthGuardProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  console.log('AuthGuard - loading:', loading, 'user:', !!user, 'profile:', !!profile, 'requireAuth:', requireAuth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    console.log('AuthGuard - redirecting to login');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    console.log('AuthGuard - not admin, redirecting to dashboard');
    return <Navigate to="/app/dashboard" replace />;
  }

  if (!requireAuth && user) {
    console.log('AuthGuard - user logged in, redirecting to dashboard');
    return <Navigate to="/app/dashboard" replace />;
  }

  console.log('AuthGuard - rendering children');
  return <>{children}</>;
};