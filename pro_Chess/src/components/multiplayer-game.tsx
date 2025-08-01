'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FC } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { offerRematch, acceptRematch } from '@/lib/firestore';
import { ChessGame } from '@/lib/chess-logic';
import type { Position, PlayerColor } from '@/lib/chess-logic';
import ChessBoard from '@/components/chess-board';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Loader2, Swords, Trophy, RefreshCw } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import WinScreen from './win-screen';

interface MultiplayerGameProps {
  gameId: string;
  anonymousId: string;
  onRematchAccepted: (newGameId: string) => void;
}

const MultiplayerGame: FC<MultiplayerGameProps> = ({ gameId, anonymousId, onRematchAccepted }) => {
  const [gameData, setGameData] = useState<any>(null);
  const [game, setGame] = useState(() => new ChessGame());
  const [board, setBoard] = useState(game.getBoard());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [kingCheckPosition, setKingCheckPosition] = useState<Position | null>(null);
  const [isOfferingRematch, setIsOfferingRematch] = useState(false);

  const playerColor: PlayerColor | null = useMemo(() => {
    if (!gameData || !anonymousId) return null;
    if (gameData.player1.id === anonymousId) return 'w';
    if (gameData.player2?.id === anonymousId) return 'b';
    return null; // Spectator or user not in game
  }, [gameData, anonymousId]);


  // Effect to listen for game state changes from Firestore
  useEffect(() => {
    const gameRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      const data = doc.data();
      if (data) {
        setGameData(data);
        game.load(data.fen);
        setBoard(game.getBoard());
        if (game.isCheck) {
          const kingPos = game.findKing(game.turn);
          setKingCheckPosition(kingPos);
        } else {
          setKingCheckPosition(null);
        }
      }
    });
    return () => unsubscribe();
  }, [gameId, game]);

  // Effect to handle rematch logic
  useEffect(() => {
    if (gameData?.rematch?.newGameId) {
        onRematchAccepted(gameData.rematch.newGameId);
        setIsOfferingRematch(false); // Reset state for new game
    }
  }, [gameData, onRematchAccepted]);


  const handleSquareClick = useCallback(async (pos: Position) => {
    if (!gameData || gameData.status !== 'active' || playerColor !== game.turn) return;

    const currentTurnColor = game.turn;
    const piece = game.get(pos);

    if (selectedSquare) {
      const move = { from: selectedSquare, to: pos };
      if (game.move(move)) {
        // Move is valid, update Firestore
        const newFen = game.fen();
        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, { 
            fen: newFen,
            moveHistory: [...gameData.moveHistory, game.moveToString(move)],
            turn: game.turn,
            updatedAt: new Date(),
            status: game.gameOver ? 'finished' : 'active',
         });
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // Invalid move, check if clicking on another piece of the current turn
        if (piece && piece.color === currentTurnColor) {
          setSelectedSquare(pos);
          setValidMoves(game.getValidMoves(pos));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // No square selected, check if clicking on a piece of the current turn
      if (piece && piece.color === currentTurnColor) {
        setSelectedSquare(pos);
        setValidMoves(game.getValidMoves(pos));
      }
    }
  }, [game, selectedSquare, gameData, gameId, playerColor]);
  
  const formattedMoveHistory = useMemo(() => {
    if (!gameData?.moveHistory) return [];
    return gameData.moveHistory.reduce((acc: string[][], move: string, i: number) => {
      if (i % 2 === 0) {
        acc.push([move]);
      } else {
        acc[acc.length - 1].push(move);
      }
      return acc;
    }, []);
  }, [gameData]);

  const gameStatusText = useMemo(() => {
    if (!gameData) return "Loading...";
    if (gameData.status === 'finished') {
        const winnerColor = game.turn === 'w' ? 'Black' : 'White';
        return game.isCheckmate ? `Checkmate! ${winnerColor} wins.` : "Stalemate. It's a draw.";
    }
    if (game.isCheck) return "Check!";

    const turnPlayerName = gameData.turn === 'w' ? (gameData.player1.name || 'White') : (gameData.player2.name || 'Black');
    
    return `${turnPlayerName}'s Turn`;
  }, [game, gameData]);

  const PlayerInfo = ({ pData, color, isTurn, isWinner } : {pData: any, color: 'White' | 'Black', isTurn: boolean, isWinner?: boolean}) => (
    <div className={`p-3 rounded-lg flex items-center gap-3 transition-all ${isTurn && gameData.status === 'active' ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/50'}`}>
        <Avatar>
            <AvatarImage src={pData?.photoURL} alt={pData?.name} />
            <AvatarFallback>{pData?.name?.charAt(0) || color.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <p className="font-semibold">{pData?.name || color}</p>
            <p className="text-sm text-muted-foreground">{color}</p>
        </div>
        {isWinner && <Trophy className="text-accent" />}
        {isTurn && gameData.status === 'active' && <Swords className="text-foreground animate-pulse" />}
    </div>
  );

  const handleOfferRematch = async () => {
    setIsOfferingRematch(true);
    try {
      await offerRematch(gameId, anonymousId);
    } catch (error) {
      console.error("Error offering rematch:", error);
      setIsOfferingRematch(false);
    }
  };

  const handleAcceptRematch = async () => {
    if (!gameData) return;
    try {
      await acceptRematch(gameId, gameData, anonymousId);
    } catch (error) {
      console.error("Error accepting rematch:", error);
    }
  };

  const winnerData = useMemo(() => {
    if (gameData?.status !== 'finished') return null;
    if (game.isCheckmate) {
        // if it's white's turn to move and they are checkmated, black wins.
        const winnerObj = game.turn === 'w' ? gameData.player2 : gameData.player1;
        return winnerObj?.id === anonymousId ? 'You' : 'Opponent';
    }
    return 'draw';
  }, [gameData, game, anonymousId]);

  if (!gameData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Loading game...</p>
      </div>
    );
  }
  
  if (gameData.status === 'waiting') {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="ml-4">Waiting for opponent to join...</p>
        </div>
      );
  }

  const isMyTurn = gameData.turn === playerColor;
  const dbWinner = gameData.status === 'finished' && !game.isStalemate ? (game.turn === 'w' ? gameData.player2 : gameData.player1) : null;
  const isDraw = game.isStalemate;
  const displayColor = playerColor || 'w'; // Default to white's perspective for spectators

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full items-start">
      <div className="lg:col-span-2 relative">
        <ChessBoard
          board={board}
          onSquareClick={handleSquareClick}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          playerColor={displayColor}
          kingInCheckPosition={kingCheckPosition}
        />
        {!isMyTurn && gameData.status === 'active' && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
                <p className="text-2xl font-bold text-white">Opponent's Turn</p>
            </div>
        )}
        {winnerData && (
          <WinScreen
            winner={winnerData}
            gameMode="friend"
            onRematch={gameData?.rematch?.offeredBy ? handleAcceptRematch : handleOfferRematch}
            onHome={() => window.location.reload()} // A simple way to go home is to reload the page
            rematchState={
                isOfferingRematch ? 'offering' :
                gameData?.rematch?.offeredBy && gameData?.rematch?.offeredBy !== anonymousId ? 'offered' :
                gameData?.rematch?.offeredBy && gameData?.rematch?.offeredBy === anonymousId ? 'waiting' :
                null
            }
          />
        )}
      </div>

      <div className="flex flex-col gap-6 w-full">
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Multiplayer Match</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${gameData.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {gameData.status.toUpperCase()}
                    </span>
                </CardTitle>
                <CardDescription>{gameStatusText}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {gameData.player2 ? (
                <PlayerInfo pData={gameData.player2} color="Black" isTurn={gameData.turn === 'b'} isWinner={dbWinner?.id === gameData.player2.id} />
               ) : (
                <div className="p-3 rounded-lg flex items-center gap-3 bg-muted/50 text-muted-foreground">Waiting for Player 2...</div>
               )}
               <div className="flex justify-center items-center">
                    <Swords className="text-muted-foreground" />
               </div>
               <PlayerInfo pData={gameData.player1} color="White" isTurn={gameData.turn === 'w'} isWinner={dbWinner?.id === gameData.player1.id} />
               
               {isDraw && (
                 <div className="text-center font-bold text-lg text-accent">It's a Draw!</div>
               )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Move History</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MultiplayerGame;
