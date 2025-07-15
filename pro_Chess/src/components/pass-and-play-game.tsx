'use client';

import { useState, useMemo, useCallback } from 'react';
import ChessBoard from '@/components/chess-board';
import { ChessGame } from '@/lib/chess-logic';
import type { Position, PlayerColor } from '@/lib/chess-logic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Wand2, History, Users, Swords } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import WinScreen from './win-screen';

interface PassAndPlayGameProps {
  onBackToMenu: () => void;
}

export default function PassAndPlayGame({ onBackToMenu }: PassAndPlayGameProps) {
  const [game, setGame] = useState(() => new ChessGame());
  const [board, setBoard] = useState(game.getBoard());
  const [fenHistory, setFenHistory] = useState<string[]>([game.fen()]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [kingCheckPosition, setKingCheckPosition] = useState<Position | null>(null);
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');

  const handleNewGame = useCallback(() => {
    const newGame = new ChessGame();
    setGame(newGame);
    setBoard(newGame.getBoard());
    setFenHistory([newGame.fen()]);
    setMoveHistory([]);
    setSelectedSquare(null);
    setValidMoves([]);
    setKingCheckPosition(null);
    setPlayerColor('w');
  }, []);

  const handleSquareClick = useCallback((pos: Position) => {
    if (game.gameOver) return;

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
        setPlayerColor(game.turn);
        if (game.isCheck) {
            setKingCheckPosition(game.findKing(game.turn));
        } else {
            setKingCheckPosition(null);
        }
      } else {
        const piece = game.get(pos);
        if (piece && piece.color === game.turn) {
          setSelectedSquare(pos);
          setValidMoves(game.getValidMoves(pos));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      const piece = game.get(pos);
      if (piece && piece.color === game.turn) {
        setSelectedSquare(pos);
        setValidMoves(game.getValidMoves(pos));
      }
    }
  }, [game, selectedSquare]);
  
  const handleUndo = useCallback(() => {
    if (fenHistory.length <= 1) return;

    const newFenHistory = fenHistory.slice(0, -1);
    const newMoveHistory = moveHistory.slice(0, -1);
    
    const lastFen = newFenHistory[newFenHistory.length - 1];
    game.load(lastFen);
    setBoard(game.getBoard());
    setFenHistory(newFenHistory);
    setMoveHistory(newMoveHistory);
    setSelectedSquare(null);
    setValidMoves([]);
    setPlayerColor(game.turn);
    if (game.isCheck) {
        setKingCheckPosition(game.findKing(game.turn));
    } else {
        setKingCheckPosition(null);
    }
  }, [game, fenHistory, moveHistory]);

  const gameStatusText = useMemo(() => {
    if (game.gameOver) {
      return game.isCheckmate ? `Checkmate! ${game.turn === 'w' ? 'Black' : 'White'} wins.` : "Stalemate.";
    }
    if (game.isCheck) return "Check!";
    return `${game.turn === 'w' ? 'White' : 'Black'}'s Turn`;
  }, [game, fenHistory]); // Depend on fenHistory to re-evaluate after moves
  
  const formattedMoveHistory = useMemo(() => {
    return moveHistory.reduce((acc: string[][], move, i) => {
      if (i % 2 === 0) {
        acc.push([move]);
      } else {
        acc[acc.length - 1].push(move);
      }
      return acc;
    }, []);
  }, [moveHistory]);

  const winner = useMemo(() => {
    if (!game.gameOver) return null;
    if (game.isCheckmate) {
        return game.turn === 'w' ? 'Black' : 'White';
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
        {winner && (
            <WinScreen 
                winner={winner}
                gameMode="pass-play"
                onRematch={handleNewGame}
                onHome={onBackToMenu}
            />
        )}
      </div>

      <div className="flex flex-col gap-6 w-full">
        <Card className="shadow-lg h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Pass & Play</CardTitle>
                <CardDescription>{gameStatusText}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
                <div className="p-4 rounded-lg bg-muted flex items-center justify-center gap-4">
                    <p className='font-semibold'>Current Turn:</p>
                    <div className='flex items-center gap-2'>
                        <span className={`w-4 h-4 rounded-full ${game.turn === 'w' ? 'bg-white' : 'bg-black'} border border-foreground`}></span>
                        <p className='font-bold text-lg'>{game.turn === 'w' ? 'White' : 'Black'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleNewGame}>
                        <Wand2 className="mr-2 h-4 w-4" /> Reset Game
                    </Button>
                    <Button onClick={handleUndo} variant="outline" disabled={fenHistory.length <= 1}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Undo
                    </Button>
                </div>

                <div className="space-y-2 pt-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2"><History /> Move History</h3>
                    <ScrollArea className="h-48 w-full rounded-md border p-2 bg-muted/30">
                        <ol className="text-sm text-muted-foreground space-y-1">
                        {formattedMoveHistory.map((pair, index) => (
                            <li key={index} className="grid grid-cols-[25px_1fr_1fr] gap-2 items-center">
                            <span className="font-bold">{index + 1}.</span>
                            <span className="font-mono">{pair[0]}</span>
                            {pair[1] && <span className="font-mono">{pair[1]}</span>}
                            </li>
                        ))}
                        {formattedMoveHistory.length === 0 && <p className="text-center text-xs text-muted-foreground pt-8">No moves yet.</p>}
                        </ol>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
