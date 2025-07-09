'use client';

import type { FC } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Bot, Users } from 'lucide-react';

interface GameSetupProps {
  onSelectMode: (mode: 'bot' | 'friend') => void;
}

const GameSetup: FC<GameSetupProps> = ({ onSelectMode }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center shadow-2xl animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tighter">Choose Your Opponent</CardTitle>
          <CardDescription>Who will you challenge today?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-6">
          <Button size="lg" onClick={() => onSelectMode('bot')}>
            <Bot className="mr-2" /> Play vs. Bot
          </Button>
          <Button size="lg" variant="secondary" onClick={() => onSelectMode('friend')}>
            <Users className="mr-2" /> Play vs. Friend
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameSetup;
