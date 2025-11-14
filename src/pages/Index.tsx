import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/3131765d-bed5-4c62-9a10-39340b48a974';

interface Team {
  id: number;
  name: string;
  total_points: number;
}

interface TeamResult {
  team_id: number;
  is_correct: boolean;
  time_seconds: number;
  has_blitz: boolean;
}

const Index = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    setTeamResults(
      teams.map(team => ({
        team_id: team.id,
        is_correct: false,
        time_seconds: 0,
        has_blitz: false
      }))
    );
  }, [teams, currentRound]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTeams(data.teams);
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные команд",
        variant: "destructive"
      });
    }
  };

  const updateTeamResult = (teamId: number, field: keyof TeamResult, value: any) => {
    setTeamResults(prev =>
      prev.map(result =>
        result.team_id === teamId ? { ...result, [field]: value } : result
      )
    );
  };

  const submitRound = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_number: currentRound,
          team_results: teamResults
        })
      });

      if (response.ok) {
        toast({
          title: "Успех!",
          description: `Раунд ${currentRound} сохранён`,
        });
        fetchTeams();
        if (currentRound < 5) {
          setCurrentRound(currentRound + 1);
        }
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить результаты",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoundCoefficient = (round: number) => {
    if (round <= 2) return 1;
    if (round <= 4) return 2;
    return 3;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 animate-slide-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Icon name="CircleDollarSign" size={48} className="text-primary animate-pulse-gold" />
            <h1 className="text-5xl md:text-7xl font-bold text-primary drop-shadow-lg">
              ОГРАБЛЕНИЕ БАНКА
            </h1>
            <Icon name="Vault" size={48} className="text-primary animate-pulse-gold" />
          </div>
          <p className="text-xl text-muted-foreground">Система подсчёта баллов</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="p-6 bg-card border-2 border-primary/30 shadow-lg shadow-primary/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Icon name="Trophy" size={32} />
                Таблица лидеров
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchTeams}
                className="border-primary text-primary hover:bg-primary hover:text-background"
              >
                <Icon name="RefreshCw" size={16} />
              </Button>
            </div>
            <div className="space-y-3">
              {teams
                .sort((a, b) => b.total_points - a.total_points)
                .map((team, index) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-primary text-background' : 'bg-muted text-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-semibold text-lg">{team.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Coins" size={20} className="text-primary" />
                      <span className="text-2xl font-bold text-primary">{team.total_points}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card className="p-6 bg-card border-2 border-secondary/30 shadow-lg shadow-secondary/20">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-primary flex items-center gap-2 mb-4">
                <Icon name="Target" size={32} />
                Раунд {currentRound}
              </h2>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(round => (
                  <Button
                    key={round}
                    variant={currentRound === round ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentRound(round)}
                    className={currentRound === round ? 'bg-primary text-background' : ''}
                  >
                    {round}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Коэффициент: <span className="text-primary font-bold">x{getRoundCoefficient(currentRound)}</span>
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {teams.map(team => {
                const result = teamResults.find(r => r.team_id === team.id);
                if (!result) return null;

                return (
                  <div key={team.id} className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                    <h3 className="font-bold text-lg text-primary">{team.name}</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Время (сек)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={result.time_seconds || ''}
                          onChange={(e) => updateTeamResult(team.id, 'time_seconds', parseInt(e.target.value) || 0)}
                          className="bg-background"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`correct-${team.id}`}
                            checked={result.is_correct}
                            onCheckedChange={(checked) => updateTeamResult(team.id, 'is_correct', checked)}
                          />
                          <Label htmlFor={`correct-${team.id}`} className="text-sm cursor-pointer">
                            Правильно
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`blitz-${team.id}`}
                            checked={result.has_blitz}
                            onCheckedChange={(checked) => updateTeamResult(team.id, 'has_blitz', checked)}
                          />
                          <Label htmlFor={`blitz-${team.id}`} className="text-sm cursor-pointer">
                            Блиц (x2)
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={submitRound}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-background font-bold text-lg h-12"
            >
              {loading ? (
                <Icon name="Loader2" size={24} className="animate-spin" />
              ) : (
                <>
                  <Icon name="Save" size={24} />
                  Сохранить раунд {currentRound}
                </>
              )}
            </Button>
          </Card>
        </div>

        <Card className="p-6 bg-secondary/10 border-2 border-secondary/30">
          <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Icon name="Info" size={24} />
            Правила начисления баллов
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-primary">Коэффициенты раундов:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Раунды 1-2: x1</li>
                <li>• Раунды 3-4: x2</li>
                <li>• Раунд 5: x3</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-primary">Баллы за место:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>🥇 1 место: 100 баллов</li>
                <li>🥈 2 место: 75 баллов</li>
                <li>🥉 3 место: 50 баллов</li>
                <li>4 место: 25 баллов</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-primary">Формула:</p>
              <p className="text-muted-foreground">
                Правильный ответ × Коэффициент × Место × Блиц
              </p>
              <p className="text-xs text-muted-foreground italic">
                Место определяется по времени автоматически
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
