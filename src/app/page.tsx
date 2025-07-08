'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import ChessBoard from '@/components/chess-board';
import GameControls from '@/components/game-controls';
import { ChessGame } from '@/lib/chess-logic';
import type { Position } from '@/lib/chess-logic';
import { Loader2 } from 'lucide-react';

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
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  const playerColor = 'w';

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

  const handleUndo = useCallback(() => {
    if (fenHistory.length < 3) return; // Need at least start, player move, and AI move FENs

    const newFenHistory = fenHistory.slice(0, -2);
    const newMoveHistory = moveHistory.slice(0, -2);
    
    game.load(newFenHistory[newFenHistory.length - 1]);
    setBoard(game.getBoard());
    setFenHistory(newFenHistory);
    setMoveHistory(newMoveHistory);
    setIsAITurn(false);
    setSelectedSquare(null);
    setValidMoves([]);
  }, [game, fenHistory, moveHistory]);

  const handleAnalysis = useCallback(async () => {
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
  }, [game]);

  const handleSuggestion = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, suggestion: true }));
    setSuggestion(null);
    try {
      const result = await game.getAIBestMoveWithReason(difficulty, true);
      setSuggestion(result);
    } catch(error) {
      console.error(error);
      setSuggestion({move: 'N/A', reason: 'Could not get suggestion.'});
    } finally {
      setIsLoading(prev => ({ ...prev, suggestion: false }));
    }
  }, [game, difficulty]);

  const gameStatusText = useMemo(() => {
    if (game.gameOver) {
      return game.isCheckmate ? `Checkmate! ${game.turn === 'w' ? 'Black' : 'White'} wins.` : "Stalemate.";
    }
    if (game.isCheck) return "Check!";
    return `${game.turn === 'w' ? 'White' : 'Black'}'s Turn`;
  }, [game]);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-background">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
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
              onDifficultyChange={setDifficulty}
              onNewGame={handleNewGame}
              onUndo={handleUndo}
              onAnalysis={handleAnalysis}
              onSuggestion={handleSuggestion}
              analysisResult={analysis}
              suggestionResult={suggestion}
              isLoading={isLoading}
              fenHistory={fenHistory}
              moveHistory={moveHistory}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
