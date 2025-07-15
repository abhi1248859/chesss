'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import ChessBoard from '@/components/chess-board';
import GameControls from '@/components/game-controls';
import { ChessGame } from '@/lib/chess-logic';
import type { Position } from '@/lib/chess-logic';
import { Loader2 } from 'lucide-react';
import WinScreen from './win-screen';
import type { AnalyzePositionOutput } from '@/ai/flows/analyze-position';

interface BotGameProps {
  initialDifficulty: number;
  onBackToMenu: () => void;
}

export default function BotGame({ initialDifficulty, onBackToMenu }: BotGameProps) {
  const [game, setGame] = useState(() => new ChessGame());
  const [board, setBoard] = useState(game.getBoard());
  const [fenHistory, setFenHistory] = useState<string[]>([game.fen()]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [isAITurn, setIsAITurn] = useState(false);
  
  const [analysis, setAnalysis] = useState<AnalyzePositionOutput | null>(null);
  const [suggestion, setSuggestion] = useState<{ move: string; reason: string } | null>(null);
  const [isLoading, setIsLoading] = useState({ analysis: false, suggestion: false });
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [kingCheckPosition, setKingCheckPosition] = useState<Position | null>(null);

  const playerColor = 'w'; // Human player is always white in bot games

  const handleNewGame = useCallback(() => {
    const newGame = new ChessGame();
    setGame(newGame);
    setBoard(newGame.getBoard());
    setFenHistory([newGame.fen()]);
    setMoveHistory([]);
    setSelectedSquare(null);
    setValidMoves([]);
    setIsAITurn(false);
    setAnalysis(null);
    setSuggestion(null);
    setKingCheckPosition(null);
  }, []);

  const handleSquareClick = useCallback((pos: Position) => {
    if (game.gameOver || isAITurn) return;

    if (selectedSquare) {
      const move = { from: selectedSquare, to: pos };
      const moveSan = game.moveToString(move);
      
      if (game.move(move)) {
        const newFen = game.fen();
        setBoard(game.getBoard());
        setFenHistory(prev => [...prev, newFen]);
        setMoveHistory(prev => [...prev, moveSan]);
        setSelectedSquare(null);
        setValidMoves([]);
        if (game.isCheck) {
            setKingCheckPosition(game.findKing(game.turn));
        } else {
            setKingCheckPosition(null);
        }
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
        const newFen = game.fen();
        setBoard(game.getBoard());
        setFenHistory(prev => [...prev, newFen]);
        setMoveHistory(prev => [...prev, aiMoveSan]);
         if (game.isCheck) {
            setKingCheckPosition(game.findKing(game.turn));
        } else {
            setKingCheckPosition(null);
        }
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
    if (isAITurn && !game.gameOver) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500); // A small delay to make AI's move feel more natural
      return () => clearTimeout(timer);
    }
  }, [isAITurn, game.gameOver, makeAIMove]);

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
    if (game.isCheck) {
        setKingCheckPosition(game.findKing(game.turn));
    } else {
        setKingCheckPosition(null);
    }
  }, [game, fenHistory, moveHistory, isAITurn]);

  const handleAnalysis = useCallback(async () => {
    if (isAITurn) return;
    setIsLoading(prev => ({ ...prev, analysis: true }));
    setAnalysis(null);
    setSuggestion(null);
    try {
      const result = await game.analyzePosition();
      setAnalysis(result);
    } catch(error) {
      console.error(error);
      setAnalysis(null);
    } finally {
      setIsLoading(prev => ({ ...prev, analysis: false }));
    }
  }, [game, isAITurn]);

  const handleSuggestion = useCallback(async () => {
    if (isAITurn) return;
    setIsLoading(prev => ({ ...prev, suggestion: true }));
    setSuggestion(null);
    setAnalysis(null);
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
    return `${game.turn === 'w' ? 'Your' : "Bot's"} Turn`;
  }, [game, fenHistory]); // Re-evaluate based on FEN history changes

  const winner = useMemo(() => {
    if (!game.gameOver) return null;
    if (game.isCheckmate) {
        return game.turn === 'b' ? 'You' : 'Bot'; // if it's black's turn to move and they are checkmated, white (You) wins.
    }
    return 'draw';
  }, [game.gameOver, game.isCheckmate, game.turn]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full items-start">
      <div className="lg:col-span-2 relative">
        <ChessBoard
          board={board}
          onSquareClick={handleSquareClick}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          playerColor={playerColor}
          kingInCheckPosition={kingCheckPosition}
        />
         {isAITurn && !game.gameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        )}
        {winner && (
            <WinScreen 
                winner={winner}
                gameMode="bot"
                onRematch={handleNewGame}
                onHome={onBackToMenu}
            />
        )}
      </div>

      <div className="flex flex-col gap-6 w-full">
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
          onBackToMenu={onBackToMenu}
        />
      </div>
    </div>
  );
}
