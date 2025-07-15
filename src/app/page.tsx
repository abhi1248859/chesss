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


export default function Home() {
  const [difficulty, setDifficulty] = useState<number>(30);
  
  const [gameMode, setGameMode] = useState<'menu' | 'bot' | 'friend-lobby' | 'friend-game'>('menu');
  const [multiplayerGameId, setMultiplayerGameId] = useState<string | null>(null);
  const [playerInfo, setPlayerInfo] = useState<{uid: string, color: 'w' | 'b'} | null>(null);

  // This is a mock user object. Multiplayer will not work without real authentication.
  // This is a placeholder to prevent the app from crashing.
  const mockUser = {
    uid: 'local-player',
    displayName: 'Guest',
    photoURL: '',
  };
  
  // Effect to automatically start multiplayer game when opponent joins
  useEffect(() => {
    if (gameMode === 'friend-lobby' && multiplayerGameId) {
      const unsub = onSnapshot(doc(db, "games", multiplayerGameId), (doc) => {
        const gameData = doc.data();
        if (gameData?.status === 'active') {
          // Determine if we are player 1 or 2
          if (gameData.player1.uid === playerInfo?.uid) {
            setPlayerInfo(prev => ({...prev!, color: 'w'}));
          } else {
            setPlayerInfo({uid: gameData.player2.uid, color: 'b'});
          }
          setGameMode('friend-game');
        }
      });
      return () => unsub();
    }
  }, [gameMode, multiplayerGameId, playerInfo?.uid]);


  const resetToMenu = useCallback(() => {
    setGameMode('menu');
    setMultiplayerGameId(null);
    setPlayerInfo(null);
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
    switch (gameMode) {
      case 'menu':
        return <GameSetup onSelectBotGame={handleSelectBotGame} onSelectFriendGame={handleSelectFriendGame} />;
      case 'friend-lobby':
        return <MultiplayerLobby onGameCreated={handleGameCreated} onGameJoined={handleGameJoined} />;
      case 'friend-game':
         if (!multiplayerGameId) return <p>Error: No game ID found.</p>;
         // Pass mockUser for now, as real user info is not available without auth
         return <MultiplayerGame gameId={multiplayerGameId} user={mockUser} onRematchAccepted={handleRematchAccepted} />;
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
