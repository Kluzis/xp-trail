import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export const AppLayout = () => {
  const { profile, signOut, isAdmin } = useAuth();
  const { trackPageView } = useAnalytics();  
  const navigate = useNavigate();

  useEffect(() => {
    trackPageView(window.location.pathname);
  }, [trackPageView]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = [
    { name: 'Domů', href: '/dashboard', icon: Icons.Home },
    { name: 'Lekce', href: '/lessons', icon: Icons.BookOpen },
    { name: 'Dovednosti', href: '/skills', icon: Icons.Target },
    { name: 'Žebříček', href: '/leaderboard', icon: Icons.Trophy },
    { name: 'Profil', href: '/profile', icon: Icons.User },
  ];

  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Icons.Settings });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Icons.Zap className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">XP Trail</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `transition-colors hover:text-foreground/80 flex items-center space-x-2 ${
                      isActive ? 'text-foreground' : 'text-foreground/60'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* XP and Level Display */}
            {profile && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium">{profile.xp} XP</div>
                  <div className="text-xs text-muted-foreground">Level {profile.level}</div>
                </div>
                <Badge variant="outline" className="level-badge">
                  Level {profile.level}
                </Badge>
              </div>
            )}

            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
                    <AvatarFallback>
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || profile?.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Icons.User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Icons.Settings className="mr-2 h-4 w-4" />
                  <span>Nastavení</span>
                </DropdownMenuItem>
                
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Icons.Shield className="mr-2 h-4 w-4" />
                    <span>Administrace</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleSignOut}>
                  <Icons.LogOut className="mr-2 h-4 w-4" />
                  <span>Odhlásit se</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-background">
        <div className="container">
          <div className="flex items-center justify-around py-2">
            {navigation.slice(0, 5).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex flex-col items-center space-y-1 p-2 transition-colors ${
                    isActive ? 'text-primary' : 'text-foreground/60'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
};