'use client';

import { useState, useCallback, useEffect } from 'react';
import GameSetup from '@/components/game-setup';
import MultiplayerLobby from '@/components/multiplayer-lobby';
import MultiplayerGame from '@/components/multiplayer-game';
import BotGame from '@/components/bot-game';
import { Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [difficulty, setDifficulty] = useState<number>(30);
  
  const [gameMode, setGameMode] = useState<'menu' | 'bot' | 'friend-lobby' | 'friend-game'>('menu');
  const [multiplayerGameId, setMultiplayerGameId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Authenticate user anonymously on component mount
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
        });
      }
    });
    return () => unsubscribe();
  }, []);
  
  // Effect to automatically start multiplayer game when opponent joins
  useEffect(() => {
    if (gameMode === 'friend-lobby' && multiplayerGameId && user) {
      const unsub = onSnapshot(doc(db, "games", multiplayerGameId), (doc) => {
        const gameData = doc.data();
        if (gameData?.status === 'active' && gameData.player2) {
          setGameMode('friend-game');
        }
      });
      return () => unsub();
    }
  }, [gameMode, multiplayerGameId, user]);


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
        return "Tactical Intellect";
    }
  }

  const renderContent = () => {
    if (!user) {
        return <p>Authenticating...</p>
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
              {/* Auth-related UI removed */}
            </div>
        </header>

        {renderContent()}
      </div>
    </main>
  );
}
