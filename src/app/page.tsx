'use client';

import { useState, useEffect, useCallback } from 'react';
import GameSetup from '@/components/game-setup';
import MultiplayerLobby from '@/components/multiplayer-lobby';
import MultiplayerGame from '@/components/multiplayer-game';
import BotGame from '@/components/bot-game';
import { LogIn, LogOut, Home as HomeIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { onAuthChange, signInWithGoogle, signOutUser } from '@/lib/auth';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';


export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [difficulty, setDifficulty] = useState<number>(30);
  
  const [gameMode, setGameMode] = useState<'menu' | 'bot' | 'friend-lobby' | 'friend-game'>('menu');
  const [multiplayerGameId, setMultiplayerGameId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoadingAuth(false);
    });
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
    setLoadingAuth(true);
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
  
  const getHeaderTitle = () => {
    switch (gameMode) {
      case 'bot':
        return "Play vs. Bot";
      case 'friend-game':
        return "Play vs. Friend";
      case 'friend-lobby':
        return "Multiplayer Lobby";
      default:
        return null;
    }
  }

  const renderContent = () => {
    if (loadingAuth) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground tracking-tighter">Tactical Intellect</h1>
            <p className="text-muted-foreground font-sans max-w-xs sm:max-w-md">The ultimate chess challenge against cunning opponents. Sign in to begin.</p>
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
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-7xl mx-auto">
        <header className="w-full flex justify-between items-center mb-6 sm:mb-8 h-12">
          {user && (
            <>
              <div className="flex-1">
                 {gameMode !== 'menu' && (
                    <Button onClick={resetToMenu} variant="outline" size="icon" className="sm:hidden">
                        <HomeIcon className="h-4 w-4" />
                        <span className="sr-only">Main Menu</span>
                    </Button>
                 )}
                 {gameMode !== 'menu' && (
                    <Button onClick={resetToMenu} variant="outline" size="sm" className="hidden sm:flex">
                        <HomeIcon className="mr-2 h-4 w-4" />
                        Main Menu
                    </Button>
                 )}
              </div>
              <div className="flex-1 text-center">
                 <h1 className="text-xl sm:text-3xl font-bold tracking-tighter">{getHeaderTitle()}</h1>
              </div>
              <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                  <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <Button onClick={handleSignOut} variant="outline" size="icon" className="sm:hidden">
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Sign Out</span>
                </Button>
                 <Button onClick={handleSignOut} variant="outline" size="sm" className="hidden sm:flex">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
              </div>
            </>
          )}
        </header>

        {renderContent()}
      </div>
    </main>
  );
}
