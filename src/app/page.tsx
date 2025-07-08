'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import ChessBoard from '@/components/chess-board';
import GameControls from '@/components/game-controls';
import { ChessGame } from '@/lib/chess-logic';
import type { Position } from '@/lib/chess-logic';
import { Loader2, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { onAuthChange, signInWithGoogle, signOutUser } from '@/lib/auth';
import type { User } from 'firebase/auth';
import { getUserProfile, unlockPremiumFeatures } from '@/lib/firestore';
import PaymentDialog from '@/components/payment-dialog';
import { useToast } from '@/hooks/use-toast';

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
  
  const [maxUnlockedDifficulty, setMaxUnlockedDifficulty] = useState(50);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [difficultyToUnlock, setDifficultyToUnlock] = useState<number | null>(null);
  const { toast } = useToast();

  const playerColor = 'w';

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setMaxUnlockedDifficulty(profile.maxUnlockedDifficulty);
            if (profile.maxUnlockedDifficulty > 50) {
              toast({ title: "Premium unlocked!", description: "You can now access all difficulty levels." });
            }
          }
        } catch (error) {
          console.error("Failed to get user profile:", error);
          toast({
            title: "Database Connection Error",
            description: "Could not connect to the database. Please ensure Firestore is enabled in your Firebase project.",
            variant: "destructive",
          });
        }
      } else {
        // Reset for logged out users
        setMaxUnlockedDifficulty(50);
        setDifficulty(d => Math.min(d, 50));
      }
    });
    return () => unsubscribe();
  }, [toast]);

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOutUser();
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
    if (isAITurn) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAITurn, makeAIMove]);

  useEffect(() => {
    if (game.isCheck) {
      const kingPos = game.findKing(game.turn);
      setKingCheckPosition(kingPos);
    } else {
      setKingCheckPosition(null);
    }
  }, [fenHistory, game]);

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
  
  const handleDifficultyChange = useCallback((newDifficulty: number) => {
    if (newDifficulty > maxUnlockedDifficulty) {
      if (user) {
        setDifficultyToUnlock(newDifficulty);
        setIsPaymentDialogOpen(true);
      } else {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to unlock premium difficulty levels.',
          variant: 'destructive',
        });
        handleSignIn();
      }
    } else {
      setDifficulty(newDifficulty);
    }
  }, [maxUnlockedDifficulty, user, toast]);

  const handleConfirmPayment = useCallback(async () => {
    if (!user) return;
    try {
      await unlockPremiumFeatures(user.uid);
      setMaxUnlockedDifficulty(100);
      if (difficultyToUnlock) {
        setDifficulty(difficultyToUnlock);
      }
      toast({
        title: 'Success!',
        description: 'Premium levels unlocked. You can now challenge the full power AI.',
      });
    } catch (error) {
      console.error("Failed to unlock premium features:", error);
      toast({
        title: 'Error',
        description: 'There was a problem unlocking premium features.',
        variant: 'destructive',
      });
    } finally {
      setIsPaymentDialogOpen(false);
      setDifficultyToUnlock(null);
    }
  }, [user, difficultyToUnlock, toast]);

  const gameStatusText = useMemo(() => {
    if (game.gameOver) {
      return game.isCheckmate ? `Checkmate! ${game.turn === 'w' ? 'Black' : 'White'} wins.` : "Stalemate.";
    }
    if (game.isCheck) return "Check!";
    return `${game.turn === 'w' ? 'White' : 'Black'}'s Turn`;
  }, [game, fenHistory]);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-background">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            {user ? (
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                  <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <Button onClick={handleSignOut} variant="outline">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={handleSignIn}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in with Google
              </Button>
            )}
          </div>
          <h1 className="text-5xl font-bold text-foreground tracking-tighter">Tactical Intellect</h1>
          <p className="text-muted-foreground mt-2 font-sans">The ultimate chess challenge against a cunning AI.</p>
        </header>

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
              maxUnlockedDifficulty={maxUnlockedDifficulty}
              isLoggedIn={!!user}
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
            />
          </div>
        </div>
      </div>
       <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onConfirmPayment={handleConfirmPayment}
      />
    </main>
  );
}
