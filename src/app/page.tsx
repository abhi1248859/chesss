'use client';

import { useState, useCallback, useEffect } from 'react';
import GameSetup from '@/components/game-setup';
import MultiplayerLobby from '@/components/multiplayer-lobby';
import MultiplayerGame from '@/components/multiplayer-game';
import BotGame from '@/components/bot-game';
import PassAndPlayGame from '@/components/pass-and-play-game';
import { Home as HomeIcon, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { signInWithGitHub, signOutUser } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Home() {
  const [difficulty, setDifficulty] = useState<number>(30);
  
  const [gameMode, setGameMode] = useState<'menu' | 'bot' | 'pass-play' | 'friend-lobby' | 'friend-game'>('menu');
  const [multiplayerGameId, setMultiplayerGameId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!authInitialized) setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, [authInitialized]);
  
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
      toast({
        title: "Login Required",
        description: "Please log in with GitHub to play with a friend.",
        variant: "destructive",
      });
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
  
  const handleLogin = async () => {
    try {
      await signInWithGitHub();
      toast({ title: 'Logged In!', description: 'You are now logged in with GitHub.' });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    resetToMenu();
    toast({ title: 'Logged Out', description: 'You have been logged out.' });
  };
  
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
        return <p className='text-center'>Initializing authentication...</p>
    }
    switch (gameMode) {
      case 'menu':
        return <GameSetup onSelectBotGame={handleSelectBotGame} onSelectFriendGame={handleSelectFriendGame} onSelectPassAndPlay={handleSelectPassAndPlay} isMultiplayerDisabled={!user} />;
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
        return <GameSetup onSelectBotGame={handleSelectBotGame} onSelectFriendGame={handleSelectFriendGame} onSelectPassAndPlay={handleSelectPassAndPlay} isMultiplayerDisabled={!user} />;
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
              {!authInitialized ? (
                <div className="w-24 h-8 bg-muted rounded-md animate-pulse" />
              ) : user ? (
                <>
                  <span className="text-sm font-medium hidden sm:inline">{user.displayName}</span>
                  <Avatar>
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'}/>
                    <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                null
              )}
            </div>
        </header>

        {renderContent()}
      </div>
    </main>
  );
}
