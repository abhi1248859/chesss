'use client';

import { useState, useCallback, useEffect } from 'react';
import GameSetup from '@/components/game-setup';
import MultiplayerLobby from '@/components/multiplayer-lobby';
import MultiplayerGame from '@/components/multiplayer-game';
import BotGame from '@/components/bot-game';
import PassAndPlayGame from '@/components/pass-and-play-game';
import { Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';

export default function Home() {
  const [difficulty, setDifficulty] = useState<number>(30);
  
  const [gameMode, setGameMode] = useState<'menu' | 'bot' | 'pass-play' | 'friend-lobby' | 'friend-game'>('menu');
  const [multiplayerGameId, setMultiplayerGameId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Authenticate user anonymously on component mount
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Try to sign in anonymously, but don't block if it fails
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed. Multiplayer mode may not work.", error);
        });
      }
      setAuthInitialized(true);
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
  
  const handleSelectPassAndPlay = () => {
    setGameMode('pass-play');
  };

  const handleSelectFriendGame = () => {
    if (user) {
      setGameMode('friend-lobby');
    } else {
      console.error("Multiplayer requires user to be authenticated.");
      // Optionally, show a toast or alert to the user
    }
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
      case 'pass-play':
        return "Pass & Play";
      case 'friend-game':
        return "Play vs. Friend";
      case 'friend-lobby':
        return "Multiplayer Lobby";
      default:
        return "Tactical Intellect";
    }
  }

  const renderContent = () => {
    if (!authInitialized) {
        return <p>Initializing...</p>
    }
    switch (gameMode) {
      case 'menu':
        return <GameSetup onSelectBotGame={handleSelectBotGame} onSelectFriendGame={handleSelectFriendGame} onSelectPassAndPlay={handleSelectPassAndPlay} />;
      case 'pass-play':
        return <PassAndPlayGame onBackToMenu={resetToMenu} />;
      case 'friend-lobby':
        // The 'user' object is now guaranteed to be non-null by `handleSelectFriendGame`
        return <MultiplayerLobby user={user!} onGameCreated={handleGameCreated} onGameJoined={handleGameJoined} />;
      case 'friend-game':
         if (!multiplayerGameId || !user) return <p>Error: No game ID found or user not authenticated.</p>;
         return <MultiplayerGame gameId={multiplayerGameId} user={user} onRematchAccepted={handleRematchAccepted} />;
      case 'bot':
        return <BotGame initialDifficulty={difficulty} onBackToMenu={resetToMenu} />;
      default:
        return <GameSetup onSelectBotGame={handleSelectBotGame} onSelectFriendGame={handleSelectFriendGame} onSelectPassAndPlay={handleSelectPassAndPlay} />;
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
