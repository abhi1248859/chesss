'use client';

import { useState, useEffect, useCallback } from 'react';
import GameSetup from '@/components/game-setup';
import MultiplayerLobby from '@/components/multiplayer-lobby';
import MultiplayerGame from '@/components/multiplayer-game';
import BotGame from '@/components/bot-game';
import { LogIn, LogOut, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { onAuthChange, signInWithGoogle, signOutUser } from '@/lib/auth';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';


export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [difficulty, setDifficulty] = useState<number>(30);
  
  const [gameMode, setGameMode] = useState<'menu' | 'bot' | 'friend-lobby' | 'friend-game'>('menu');
  const [multiplayerGameId, setMultiplayerGameId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, []);
  
  // Effect to automatically start multiplayer game when opponent joins
  useEffect(() => {
    if (gameMode === 'friend-lobby' && multiplayerGameId) {
      const unsub = onSnapshot(doc(db, "games", multiplayerGameId), (doc) => {
        const gameData = doc.data();
        if (gameData?.status === 'active') {
          setGameMode('friend-game');
        }
      });
      return () => unsub();
    }
  }, [gameMode, multiplayerGameId]);


  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOutUser();
    setGameMode('menu');
  };
  
  const resetToMenu = useCallback(() => {
    setGameMode('menu');
    setMultiplayerGameId(null);
  }, []);

  const handleSelectBotGame = (newDifficulty: number) => {
    setDifficulty(newDifficulty);
    setGameMode('bot');
  };

  const handleSelectFriendGame = () => {
    setGameMode('friend-lobby');
  };
  
  const handleGameCreated = (gameId: string) => {
    setMultiplayerGameId(gameId);
  }

  const handleGameJoined = (gameId: string) => {
    setMultiplayerGameId(gameId);
    setGameMode('friend-game');
  };
  
  const handleRematchAccepted = useCallback((newGameId: string) => {
    setMultiplayerGameId(newGameId);
  }, []);

  const renderContent = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <h1 className="text-6xl font-bold text-foreground tracking-tighter">Tactical Intellect</h1>
            <p className="text-muted-foreground font-sans max-w-md text-center">The ultimate chess challenge against cunning opponents. Sign in to begin.</p>
            <Button onClick={handleSignIn} size="lg">
                <LogIn className="mr-2 h-5 w-5" />
                Sign in with Google
            </Button>
        </div>
      );
    }

    switch (gameMode) {
      case 'menu':
        return <GameSetup onSelectBotGame={handleSelectBotGame} onSelectFriendGame={handleSelectFriendGame} />;
      case 'friend-lobby':
        return <MultiplayerLobby user={user} onGameCreated={handleGameCreated} onGameJoined={handleGameJoined} />;
      case 'friend-game':
         if (!multiplayerGameId) return <p>Error: No game ID found.</p>;
         return <MultiplayerGame gameId={multiplayerGameId} user={user} onRematchAccepted={handleRematchAccepted} />;
      case 'bot':
        return <BotGame initialDifficulty={difficulty} onBackToMenu={resetToMenu} />;
      default:
        return <GameSetup onSelectBotGame={handleSelectBotGame} onSelectFriendGame={handleSelectFriendGame} />;
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-background">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8 relative h-12">
          {user && (
            <>
              <div className="absolute top-0 left-0">
                <Button onClick={resetToMenu} variant="outline" size="sm">
                  <HomeIcon className="mr-2" />
                  Main Menu
                </Button>
              </div>
              <div className="absolute top-0 right-0">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    <LogOut className="mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
              {gameMode === 'bot' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                   <h1 className="text-4xl font-bold text-foreground tracking-tighter">Play vs. Bot</h1>
                </div>
              )}
              {gameMode === 'friend-game' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                   <h1 className="text-4xl font-bold text-foreground tracking-tighter">Play vs. Friend</h1>
                </div>
              )}
            </>
          )}
        </header>

        {renderContent()}
      </div>
    </main>
  );
}
