'use client';

import { useState, type FC } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Bot, Users, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface GameSetupProps {
  onSelectBotGame: (difficulty: number) => void;
  onSelectFriendGame: () => void;
  onSelectPassAndPlay: () => void;
}

const difficultyLevels = [
  { name: 'Easy', value: 20 },
  { name: 'Medium', value: 40 },
  { name: 'Hard', value: 60 },
  { name: 'Master', value: 80 },
  { name: 'Impossible', value: 100 },
];

const GameSetup: FC<GameSetupProps> = ({ onSelectBotGame, onSelectFriendGame, onSelectPassAndPlay }) => {
  const [view, setView] = useState<'menu' | 'bot-setup'>('menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState<{ name: string; value: number } | null>(null);

  const handleDifficultySelect = (level: { name: string; value: number }) => {
    setSelectedDifficulty(level);
  };
  
  const handlePlayGame = () => {
      if (selectedDifficulty) {
          onSelectBotGame(selectedDifficulty.value);
      }
  }

  if (view === 'bot-setup') {
    return (
      <div className="flex items-center justify-center w-full">
        <Card className="w-full max-w-md text-center shadow-2xl animate-fade-in-up">
          <CardHeader>
             <div className="relative">
                <Button variant="ghost" size="icon" className="absolute -top-2 -left-2" onClick={() => setView('menu')}>
                    <ArrowLeft />
                </Button>
                <CardTitle className="text-3xl tracking-tighter pt-2">Choose Difficulty</CardTitle>
                <CardDescription>Select a level to challenge the bot.</CardDescription>
             </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {difficultyLevels.map((level) => (
                    <Button
                        key={level.name}
                        variant={selectedDifficulty?.name === level.name ? 'default' : 'secondary'}
                        onClick={() => handleDifficultySelect(level)}
                        size="lg"
                    >
                        {level.name}
                    </Button>
                ))}
            </div>
            
            {selectedDifficulty && (
                 <div className="mt-4 flex flex-col gap-4 animate-fade-in-up">
                    <p className="text-sm text-muted-foreground">
                        Ready to Play: Difficulty - {selectedDifficulty.name}
                    </p>
                    <Button size="lg" onClick={handlePlayGame}>
                        Play Game
                    </Button>
                 </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center shadow-2xl animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tighter">Choose Your Opponent</CardTitle>
          <CardDescription>Who will you challenge today?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-6">
          <Button size="lg" onClick={() => setView('bot-setup')}>
            <Bot className="mr-2" /> Play vs. Bot
          </Button>
          <Button size="lg" variant="secondary" onClick={onSelectPassAndPlay}>
            <Users className="mr-2" /> Pass & Play
          </Button>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={onSelectFriendGame}
            className="w-full"
          >
            <Users className="mr-2" /> Play vs. Friend
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameSetup;
