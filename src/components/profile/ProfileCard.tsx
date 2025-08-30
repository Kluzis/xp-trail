import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { Profile } from '@/lib/types';
import { useProfile } from '@/hooks/useProfile';

interface ProfileCardProps {
  profile: Profile;
  showProgress?: boolean;
  compact?: boolean;
}

export const ProfileCard = ({ profile, showProgress = true, compact = false }: ProfileCardProps) => {
  const { calculateLevel } = useProfile();
  const levelInfo = calculateLevel(profile.xp);
  
  const progressPercentage = Math.round(
    ((profile.xp - levelInfo.currentLevelXp) / (levelInfo.nextLevelXp - levelInfo.currentLevelXp)) * 100
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-amber-600';
      case 'silver': return 'text-slate-400';
      case 'gold': return 'text-yellow-500';
      case 'platinum': return 'text-purple-500';
      case 'diamond': return 'text-cyan-400';
      default: return 'text-slate-500';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return Icons.Award;
      case 'silver': return Icons.Star;
      case 'gold': return Icons.Crown;
      case 'platinum': return Icons.Gem;
      case 'diamond': return Icons.Gem;
      default: return Icons.Award;
    }
  };

  if (compact) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg truncate">{profile.username}</h3>
                <Badge variant="secondary" className="shrink-0">
                  Level {levelInfo.level}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Icons.Zap className="h-4 w-4" />
                <span>{profile.xp.toLocaleString()} XP</span>
                <Icons.Flame className="h-4 w-4 ml-2" />
                <span>{profile.current_streak} streak</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const TierIcon = getTierIcon(levelInfo.tier);

  return (
    <Card className="glass-card">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url} alt={profile.username} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <CardTitle className="text-2xl">{profile.username}</CardTitle>
        {profile.full_name && (
          <p className="text-muted-foreground">{profile.full_name}</p>
        )}
        
        <div className="flex items-center justify-center space-x-2 mt-2">
          <TierIcon className={`h-5 w-5 ${getTierColor(levelInfo.tier)}`} />
          <Badge variant="secondary" className="text-lg px-3 py-1">
            Level {levelInfo.level}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* XP Progress */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Experience Points</span>
              <span className="text-sm text-muted-foreground">
                {profile.xp.toLocaleString()} / {levelInfo.nextLevelXp.toLocaleString()} XP
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {(levelInfo.nextLevelXp - profile.xp).toLocaleString()} XP to next level
            </p>
          </div>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center mb-1">
              <Icons.Flame className="h-5 w-5 text-orange-500 mr-1" />
              <span className="text-2xl font-bold">{profile.current_streak}</span>
            </div>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center mb-1">
              <Icons.Trophy className="h-5 w-5 text-yellow-500 mr-1" />
              <span className="text-2xl font-bold">{profile.longest_streak}</span>
            </div>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tier</span>
            <div className="flex items-center space-x-1">
              <TierIcon className={`h-4 w-4 ${getTierColor(levelInfo.tier)}`} />
              <span className="font-medium capitalize">{levelInfo.tier}</span>
            </div>
          </div>
          
          {profile.age && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Age</span>
              <span className="font-medium">{profile.age}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Joined</span>
            <span className="font-medium">
              {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};