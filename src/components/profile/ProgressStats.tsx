import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons';
import { DashboardStats } from '@/lib/types';

interface ProgressStatsProps {
  stats: DashboardStats;
}

export const ProgressStats = ({ stats }: ProgressStatsProps) => {
  const progressToNextLevel = Math.round(
    ((stats.totalXp - (stats.nextLevelXp - 100)) / 100) * 100
  );

  const statItems = [
    {
      icon: Icons.BookOpen,
      label: 'Completed Lessons',
      value: stats.completedLessons,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: Icons.Target,
      label: 'Available Skills',
      value: stats.availableSkills,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Icons.Trophy,
      label: 'Active Challenges',
      value: stats.activeChallenges,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      icon: Icons.Award,
      label: 'Global Rank',
      value: `#${stats.rank}`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icons.TrendingUp className="h-5 w-5" />
            <span>Level Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icons.Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold">Level {stats.currentLevel}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.totalXp.toLocaleString()} XP
            </span>
          </div>
          
          <Progress value={progressToNextLevel} className="h-3" />
          
          <p className="text-sm text-muted-foreground text-center">
            {(stats.nextLevelXp - stats.totalXp).toLocaleString()} XP to Level {stats.currentLevel + 1}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <Card key={index} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${item.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Streak Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icons.Flame className="h-5 w-5 text-orange-500" />
            <span>Learning Streak</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-500 mb-2">
              {stats.currentStreak}
            </div>
            <p className="text-muted-foreground">
              {stats.currentStreak === 1 ? 'Day' : 'Days'} in a row
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Keep learning daily to maintain your streak!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};