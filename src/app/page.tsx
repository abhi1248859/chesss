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
import { nanoid } from 'nanoid';

// Function to get or create a unique anonymous ID for the user
const getAnonymousId = (): string => {
  let anonymousId = localStorage.getItem('anonymousPlayerId');
  if (!anonymousId) {
    anonymousId = nanoid();
    localStorage.setItem('anonymousPlayerId', anonymousId);
  }
  return anonymousId;
};


export default function Home() {
  const [difficulty, setDifficulty] = useState<number>(30);
  
  const [gameMode, setGameMode] = useState<'menu' | 'bot' | 'pass-play' | 'friend-lobby' | 'friend-game'>('menu');
  const [multiplayerGameId, setMultiplayerGameId] = useState<string | null>(null);
  const [anonymousId, setAnonymousId] = useState<string>('');
  
  useEffect(() => {
    setAnonymousId(getAnonymousId());
  }, []);
  
  // Effect to automatically start multiplayer game when opponent joins
  useEffect(() => {
    if (gameMode === 'friend-lobby' && multiplayerGameId && anonymousId) {
      const unsub = onSnapshot(doc(db, "games", multiplayerGameId), (doc) => {
        const gameData = doc.data();
        if (gameData?.status === 'active' && gameData.player2?.id) {
          setGameMode('friend-game');
        }
      });
      return () => unsub();
    }
  }, [gameMode, multiplayerGameId, anonymousId]);


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
    switch (gameMode) {
      case 'menu':
        return <GameSetup onSelectBotGame={handleSelectBotGame} onSelectFriendGame={handleSelectFriendGame} onSelectPassAndPlay={handleSelectPassAndPlay} />;
      case 'friend-lobby':
        return <MultiplayerLobby anonymousId={anonymousId} onGameCreated={handleGameCreated} onGameJoined={handleGameJoined} />;
      case 'friend-game':
         if (!multiplayerGameId || !anonymousId) return <p>Error: No game ID found or user not identified.</p>;
         return <MultiplayerGame gameId={multiplayerGameId} anonymousId={anonymousId} onRematchAccepted={handleRematchAccepted} />;
      case 'bot':
        return <BotGame initialDifficulty={difficulty} onBackToMenu={resetToMenu} />;
      case 'pass-play':
        return <PassAndPlayGame onBackToMenu={resetToMenu} />;
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
              {/* This space is intentionally left blank after removing auth */}
            </div>
        </header>

        {renderContent()}
      </div>
    </main>
  );
}
