'use client';

import { Button } from './ui/button';
import { Home, Loader2, RefreshCw, Swords } from 'lucide-react';

type GameMode = 'bot' | 'pass-play' | 'friend';
type Winner = 'You' | 'Bot' | 'Opponent' | 'White' | 'Black' | 'draw';

interface WinScreenProps {
  winner: Winner;
  gameMode: GameMode;
  onRematch: () => void;
  onHome: () => void;
  rematchState?: 'offering' | 'offered' | 'waiting' | null;
}

export default function WinScreen({ winner, gameMode, onRematch, onHome, rematchState }: WinScreenProps) {
    const getTitle = () => {
        if (winner === 'draw') return "🤝 It's a Draw! 🤝";
        switch (gameMode) {
            case 'bot':
                return winner === 'You' ? '🎉 You Beat the Bot! 🎉' : '🤖 Bot Wins!';
            case 'pass-play':
                return `🏆 ${winner} Wins! 🏆`;
            case 'friend':
                return winner === 'You' ? '👑 You are Victorious! 👑' : '😔 Opponent Wins...';
        }
    };
    
    const getDescription = () => {
        if (winner === 'draw') return "A well-played game by both sides ends in a stalemate.";
         switch (gameMode) {
            case 'bot':
                return winner === 'You' ? 'Smart move! You outplayed the AI.' : "Don't worry, even grandmasters make mistakes. Try again!";
            case 'pass-play':
                return `Congratulations ${winner}! A brilliant display of tactics.`;
            case 'friend':
                return winner === 'You' ? 'You crushed your opponent with superior strategy!' : 'A tough opponent! Better luck next time.';
        }
    }

    const getEmoji = () => {
        if (winner === 'draw') return '🤝';
        if (winner === 'You') return '🏆';
        if (winner === 'Bot' || winner === 'Opponent') return '💻';
        return '🏅';
    }

    const getRematchButton = () => {
        const baseProps = {
            className: "w-full sm:w-auto",
            onClick: onRematch
        };

        if (gameMode !== 'friend') {
            return (
                <Button {...baseProps}>
                    <RefreshCw /> Play Again
                </Button>
            );
        }

        switch (rematchState) {
            case 'offering':
                return <Button {...baseProps} disabled><Loader2 className="animate-spin" /> Sending Offer...</Button>;
            case 'waiting':
                 return <Button {...baseProps} disabled><Loader2 className="animate-spin" /> Waiting for Opponent...</Button>;
            case 'offered':
                return <Button {...baseProps}><Swords /> Accept Rematch</Button>;
            default:
                return <Button {...baseProps}><RefreshCw /> Request Rematch</Button>;
        }
    }

  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-10 animate-in fade-in-50">
      <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-xl shadow-2xl border">
        <div className="text-7xl animate-bounce">{getEmoji()}</div>
        <h1 className="text-4xl font-bold tracking-tighter text-foreground">
          {getTitle()}
        </h1>
        <p className="text-muted-foreground max-w-sm">
            {getDescription()}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full max-w-xs">
          {getRematchButton()}
          <Button variant="outline" onClick={onHome} className="w-full sm:w-auto">
            <Home /> Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
