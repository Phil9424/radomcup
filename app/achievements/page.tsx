import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, Star, Zap, Target, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AchievementsPage() {
  const supabase = await createClient();

  // Fetch all achievements with unlock count
  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .order("category", { ascending: true });

  // Fetch player achievements to count unlocks
  const { data: playerAchievements } = await supabase
    .from("player_achievements")
    .select("achievement_id, player_id, players(name)");

  // Count unlocks per achievement
  const unlockCountMap = new Map<string, number>();
  const recentUnlocksMap = new Map<string, Array<{ playerName: string }>>();

  playerAchievements?.forEach((pa: any) => {
    const count = unlockCountMap.get(pa.achievement_id) || 0;
    unlockCountMap.set(pa.achievement_id, count + 1);

    const unlocks = recentUnlocksMap.get(pa.achievement_id) || [];
    unlocks.push({ playerName: pa.players.name });
    recentUnlocksMap.set(pa.achievement_id, unlocks);
  });

  // Group achievements by category
  const categories = new Map<string, typeof achievements>();
  achievements?.forEach((achievement) => {
    const category = achievement.category || 'general';
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(achievement);
  });

  function getCategoryIcon(category: string) {
    switch (category) {
      case 'milestones':
        return <Trophy className="h-5 w-5" />;
      case 'tournament':
        return <Target className="h-5 w-5" />;
      case 'consistency':
        return <TrendingUp className="h-5 w-5" />;
      case 'special':
        return <Star className="h-5 w-5" />;
      case 'participation':
        return <Zap className="h-5 w-5" />;
      case 'points':
        return <Award className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case 'milestones':
        return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 'tournament':
        return 'from-blue-500/20 to-blue-500/5 border-blue-500/30';
      case 'consistency':
        return 'from-green-500/20 to-green-500/5 border-green-500/30';
      case 'special':
        return 'from-purple-500/20 to-purple-500/5 border-purple-500/30';
      case 'participation':
        return 'from-orange-500/20 to-orange-500/5 border-orange-500/30';
      case 'points':
        return 'from-red-500/20 to-red-500/5 border-red-500/30';
      default:
        return 'from-gray-500/20 to-gray-500/5 border-gray-500/30';
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Award className="h-10 w-10 text-primary" />
            <h1 className="text-5xl font-bold">Достижения</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Получайте достижения, завершая турниры и достигая новых высот
          </p>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4">
        {!achievements || achievements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Award className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground">
                Достижения пока недоступны
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto">
              <TabsTrigger value="all">Все достижения</TabsTrigger>
              {Array.from(categories.keys()).map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => {
                  const unlockCount = unlockCountMap.get(achievement.id) || 0;
                  const recentUnlocks = recentUnlocksMap.get(achievement.id) || [];
                  
                  return (
                    <Card 
                      key={achievement.id}
                      className={`bg-gradient-to-br ${getCategoryColor(achievement.category)} hover:shadow-lg transition-all`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-4xl">{achievement.icon}</div>
                          <Badge variant="secondary">
                            {разблокированоCount} {разблокированоCount === 1 ? 'разблокировано' : 'разблокировано'}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{achievement.name}</CardTitle>
                        <CardDescription className="text-base">
                          {achievement.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                          {getCategoryIcon(achievement.category)}
                          <span className="text-muted-foreground capitalize">
                            {achievement.category}
                          </span>
                        </div>
                        {recentUnlocks.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Недавно разблокировали:</p>
                            <div className="flex flex-wrap gap-1">
                              {recentUnlocks.slice(0, 3).map((unlock, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {unlock.playerName}
                                </Badge>
                              ))}
                              {recentUnlocks.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +ещё {recentUnlocks.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {Array.from(categories.entries()).map(([category, categoryAchievements]) => (
              <TabsContent key={category} value={category}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2 capitalize flex items-center gap-2">
                    {getCategoryIcon(category)}
                    Достижения {category}
                  </h2>
                  <p className="text-muted-foreground">
                    {categoryAchievements.length} достижений в этой категории
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {categoryAchievements.map((achievement) => {
                    const unlockCount = unlockCountMap.get(achievement.id) || 0;
                    const recentUnlocks = recentUnlocksMap.get(achievement.id) || [];
                    
                    return (
                      <Card 
                        key={achievement.id}
                        className={`bg-gradient-to-br ${getCategoryColor(achievement.category)} hover:shadow-lg transition-all`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-4xl">{achievement.icon}</div>
                            <Badge variant="secondary">
                              {unlockCount} разблокировано
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">{achievement.name}</CardTitle>
                          <CardDescription className="text-base">
                            {achievement.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {recentUnlocks.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Недавно разблокировали:</p>
                              <div className="flex flex-wrap gap-1">
                                {recentUnlocks.slice(0, 3).map((unlock, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {unlock.playerName}
                                  </Badge>
                                ))}
                                {recentUnlocks.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +ещё {recentUnlocks.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
