import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

const Dashboard = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  const nextLevel = profile.level + 1;
  const currentLevelXp = profile.level * 100; // Simplified calculation
  const nextLevelXp = nextLevel * 100;
  const progressPercent = ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vítejte zpět, {profile.username}!</h1>
          <p className="text-muted-foreground">Pokračujte ve svém učení</p>
        </div>
        <Badge className="level-badge">
          Level {profile.level}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové XP</CardTitle>
            <Icons.Zap className="h-4 w-4 text-xp-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.xp}</div>
            <p className="text-xs text-muted-foreground">
              {nextLevelXp - profile.xp} XP do dalšího levelu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktuální série</CardTitle>
            <Icons.Flame className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.current_streak}</div>
            <p className="text-xs text-muted-foreground">
              Nejdelší: {profile.longest_streak} dní
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Icons.Crown className="h-4 w-4 text-level-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.level}</div>
            <Progress value={progressPercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hodnost</CardTitle>
            <Icons.Trophy className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#1</div>
            <p className="text-xs text-muted-foreground">
              V žebříčku
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pokračovat v učení</CardTitle>
            <CardDescription>Dokončete svou poslední lekci</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Icons.BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Zatím žádné lekce</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Denní výzva</CardTitle>
            <CardDescription>Dokončete 1 lekci dnes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Icons.Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Začněte první lekci!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;