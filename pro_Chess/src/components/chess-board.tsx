'use client';

import type { FC } from 'react';
import { ChessPiece } from './chess-pieces';
import type { Piece, Position } from '@/lib/chess-logic';
import { cn } from '@/lib/utils';

interface ChessBoardProps {
  board: (Piece | null)[][];
  onSquareClick: (pos: Position) => void;
  selectedSquare: Position | null;
  validMoves: Position[];
  playerColor: 'w' | 'b';
  kingInCheckPosition: Position | null;
}

const ChessBoard: FC<ChessBoardProps> = ({ board, onSquareClick, selectedSquare, validMoves, playerColor, kingInCheckPosition }) => {
  const isFlipped = playerColor === 'b';
  const boardRows = isFlipped ? [...board].reverse() : board;

  const isValidMove = (pos: Position) => {
    return validMoves.some(move => move.row === pos.row && move.col === pos.col);
  };

  return (
    <div className="aspect-square w-full max-w-2xl mx-auto shadow-2xl rounded-lg overflow-hidden border-2 sm:border-4 border-card">
      <div className="grid grid-cols-8 h-full">
        {boardRows.map((row, rowIndex) => {
          const actualRowIndex = isFlipped ? 7 - rowIndex : rowIndex;
          const squareRow = isFlipped ? [...row].reverse() : row;

          return squareRow.map((piece, colIndex) => {
            const actualColIndex = isFlipped ? 7 - colIndex : colIndex;
            const pos = { row: actualRowIndex, col: actualColIndex };

            const isLightSquare = (actualRowIndex + actualColIndex) % 2 !== 0;
            const isSelected = selectedSquare?.row === actualRowIndex && selectedSquare?.col === actualColIndex;
            const isMoveTarget = isValidMove(pos);
            const isKingInCheck = !!kingInCheckPosition && kingInCheckPosition.row === actualRowIndex && kingInCheckPosition.col === actualColIndex;

            return (
              <div
                key={`${actualRowIndex}-${actualColIndex}`}
                onClick={() => onSquareClick(pos)}
                className={cn(
                  'flex items-center justify-center relative aspect-square',
                  isLightSquare ? 'bg-board-light-square' : 'bg-board-dark-square',
                  'cursor-pointer transition-colors duration-200'
                )}
              >
                {piece && <ChessPiece piece={piece} />}
                {isKingInCheck && (
                  <div className="absolute inset-0 bg-destructive/50" />
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-accent/50" />
                )}
                {isMoveTarget && (
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="h-1/3 w-1/3 rounded-full bg-accent/50"></div>
                   </div>
                )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

export default ChessBoard;
