'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import ChessBoard from '@/components/chess-board';
import GameControls from '@/components/game-controls';
import GameSetup from '@/components/game-setup';
import MultiplayerLobby from '@/components/multiplayer-lobby';
import MultiplayerGame from '@/components/multiplayer-game';
import { ChessGame } from '@/lib/chess-logic';
import type { Position } from '@/lib/chess-logic';
import { Loader2, LogIn, LogOut, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { onAuthChange, signInWithGoogle, signOutUser } from '@/lib/auth';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';


export default function Home() {
  const [game, setGame] = useState(() => new ChessGame());
  const [board, setBoard] = useState(game.getBoard());
  const [fenHistory, setFenHistory] = useState<string[]>([game.fen()]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [isAITurn, setIsAITurn] = useState(false);
  
  const [analysis, setAnalysis] = useState<string>('');
  const [suggestion, setSuggestion] = useState<{ move: string; reason: string } | null>(null);
  const [isLoading, setIsLoading] = useState({ analysis: false, suggestion: false });
  const [difficulty, setDifficulty] = useState<number>(30);
  const [user, setUser] = useState<User | null>(null);
  const [kingCheckPosition, setKingCheckPosition] = useState<Position | null>(null);
  
  const [gameMode, setGameMode] = useState<'menu' | 'bot' | 'friend-lobby' | 'friend-game'>('menu');
  const [multiplayerGameId, setMultiplayerGameId] = useState<string | null>(null);

  const playerColor = 'w';

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

  const handleNewGame = useCallback(() => {
    const newGame = new ChessGame();
    setGame(newGame);
    setBoard(newGame.getBoard());
    setFenHistory([newGame.fen()]);
    setMoveHistory([]);
    setSelectedSquare(null);
    setValidMoves([]);
    setIsAITurn(false);
    setAnalysis('');
    setSuggestion(null);
  }, []);
  
  const resetToMenu = useCallback(() => {
    handleNewGame();
    setGameMode('menu');
    setMultiplayerGameId(null);
  }, [handleNewGame]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (game.gameOver || isAITurn) return;

    if (selectedSquare) {
      const move = { from: selectedSquare, to: pos };
      const moveSan = game.moveToString(move);
      
      if (game.move(move)) {
        setBoard(game.getBoard());
        setFenHistory(prev => [...prev, game.fen()]);
        setMoveHistory(prev => [...prev, moveSan]);
        setSelectedSquare(null);
        setValidMoves([]);
        if (!game.gameOver) {
          setIsAITurn(true);
        }
      } else {
        const piece = game.get(pos);
        if (piece && piece.color === playerColor) {
          setSelectedSquare(pos);
          setValidMoves(game.getValidMoves(pos));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      const piece = game.get(pos);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(pos);
        setValidMoves(game.getValidMoves(pos));
      }
    }
  }, [game, selectedSquare, isAITurn, playerColor]);
  
  const makeAIMove = useCallback(async () => {
    if (!isAITurn || game.gameOver) return;

    setIsLoading(prev => ({ ...prev, suggestion: true }));
    try {
      const aiMoveSan = await game.getAIBestMove(difficulty);
      if (aiMoveSan && game.move(aiMoveSan)) {
        setBoard(game.getBoard());
        setFenHistory(prev => [...prev, game.fen()]);
        setMoveHistory(prev => [...prev, aiMoveSan]);
      } else {
        console.error("AI suggested an invalid or null move:", aiMoveSan);
      }
    } catch (error) {
      console.error("AI move error:", error);
    } finally {
      setIsAITurn(false);
      setIsLoading(prev => ({ ...prev, suggestion: false }));
    }
  }, [isAITurn, game, difficulty]);

  useEffect(() => {
    if (gameMode === 'bot' && isAITurn) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAITurn, makeAIMove, gameMode]);

  useEffect(() => {
    if (gameMode === 'bot') {
        const currentFen = fenHistory[fenHistory.length - 1];
        game.load(currentFen);
        if (game.isCheck) {
            const kingPos = game.findKing(game.turn);
            setKingCheckPosition(kingPos);
        } else {
            setKingCheckPosition(null);
        }
    }
  }, [fenHistory, game, gameMode]);

  const handleUndo = useCallback(() => {
    if (fenHistory.length < 3 || isAITurn) return; // Need at least start, player move, and AI move FENs

    const newFenHistory = fenHistory.slice(0, -2);
    const newMoveHistory = moveHistory.slice(0, -2);
    
    game.load(newFenHistory[newFenHistory.length - 1]);
    setBoard(game.getBoard());
    setFenHistory(newFenHistory);
    setMoveHistory(newMoveHistory);
    setIsAITurn(false);
    setSelectedSquare(null);
    setValidMoves([]);
  }, [game, fenHistory, moveHistory, isAITurn]);

  const handleAnalysis = useCallback(async () => {
    if (isAITurn) return;
    setIsLoading(prev => ({ ...prev, analysis: true }));
    setAnalysis('');
    try {
      const result = await game.analyzePosition();
      setAnalysis(result.analysis);
    } catch(error) {
      console.error(error);
      setAnalysis('Could not analyze position.');
    } finally {
      setIsLoading(prev => ({ ...prev, analysis: false }));
    }
  }, [game, isAITurn]);

  const handleSuggestion = useCallback(async () => {
    if (isAITurn) return;
    setIsLoading(prev => ({ ...prev, suggestion: true }));
    setSuggestion(null);
    try {
      const result = await game.getAIBestMoveWithReason(difficulty);
      setSuggestion(result);
    } catch(error) {
      console.error(error);
      setSuggestion({move: 'N/A', reason: 'Could not get suggestion.'});
    } finally {
      setIsLoading(prev => ({ ...prev, suggestion: false }));
    }
  }, [game, difficulty, isAITurn]);
  
  const handleDifficultyChange = (newDifficulty: number) => {
    setDifficulty(newDifficulty);
  };

  const gameStatusText = useMemo(() => {
    if (game.gameOver) {
      return game.isCheckmate ? `Checkmate! ${game.turn === 'w' ? 'Black' : 'White'} wins.` : "Stalemate.";
    }
    if (game.isCheck) return "Check!";
    return `${game.turn === 'w' ? 'White' : 'Black'}'s Turn`;
  }, [game, fenHistory]);
  
  const handleSelectMode = (mode: 'bot' | 'friend') => {
    handleNewGame(); // Reset any existing game
    if (mode === 'bot') {
      setGameMode('bot');
    } else {
      setGameMode('friend-lobby');
    }
  };

  const handleGameCreated = (gameId: string) => {
    setMultiplayerGameId(gameId);
  }

  const handleGameJoined = (gameId: string) => {
    setMultiplayerGameId(gameId);
    setGameMode('friend-game');
  };
  
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
        return <GameSetup onSelectMode={handleSelectMode} />;
      case 'friend-lobby':
        return <MultiplayerLobby user={user} onGameCreated={handleGameCreated} onGameJoined={handleGameJoined} />;
      case 'friend-game':
         if (!multiplayerGameId) return <p>Error: No game ID found.</p>;
         return <MultiplayerGame gameId={multiplayerGameId} user={user} />;
      case 'bot':
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 relative">
              <ChessBoard
                board={board}
                onSquareClick={handleSquareClick}
                selectedSquare={selectedSquare}
                validMoves={validMoves}
                playerColor={playerColor}
                kingInCheckPosition={kingCheckPosition}
              />
               {isAITurn && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  </div>
              )}
            </div>
  
            <div className="flex flex-col gap-6">
              <GameControls
                status={gameStatusText}
                difficulty={difficulty}
                onDifficultyChange={handleDifficultyChange}
                onNewGame={handleNewGame}
                onUndo={handleUndo}
                onAnalysis={handleAnalysis}
                onSuggestion={handleSuggestion}
                analysisResult={analysis}
                suggestionResult={suggestion}
                isLoading={isLoading}
                fenHistory={fenHistory}
                moveHistory={moveHistory}
                isAITurn={isAITurn}
                onBackToMenu={resetToMenu}
              />
            </div>
          </div>
        );
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
            </>
          )}
        </header>

        {renderContent()}
      </div>
    </main>
  );
}
