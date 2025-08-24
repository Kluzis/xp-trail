import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

const Lessons = () => {
  // Mock data - would be fetched from Supabase
  const categories = [
    {
      id: '1',
      name: 'Základy',
      description: 'Základní dovednosti a principy',
      color: '#3B82F6',
      lessons: [
        { id: '1', title: 'Úvod do základů', duration: 15, xp: 50, difficulty: 1 },
        { id: '2', title: 'Pokročilé základy', duration: 20, xp: 75, difficulty: 2 },
      ]
    },
    {
      id: '2', 
      name: 'Pokročilé',
      description: 'Pokročilé techniky a koncepty',
      color: '#10B981',
      lessons: [
        { id: '3', title: 'Pokročilé techniky', duration: 30, xp: 100, difficulty: 3 },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lekce</h1>
        <p className="text-muted-foreground">Objevte nové dovednosti</p>
      </div>

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <div>
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.lessons.map((lesson) => (
                <Card key={lesson.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      <Badge variant="outline">
                        {lesson.xp} XP
                      </Badge>
                    </div>
                    <CardDescription>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Icons.Clock className="h-4 w-4" />
                          <span>{lesson.duration} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icons.Star className="h-4 w-4" />
                          <span>Level {lesson.difficulty}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icons.Play className="h-4 w-4 text-primary" />
                        <span className="text-sm">Začít lekci</span>
                      </div>
                      <Icons.ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lessons;