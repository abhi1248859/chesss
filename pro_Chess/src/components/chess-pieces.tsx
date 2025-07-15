import type { FC } from 'react';
import type { Piece } from '@/lib/chess-logic';
import { cn } from '@/lib/utils';

interface ChessPieceProps {
  piece: Piece;
  className?: string;
}

const pieceMap = {
  w: {
    k: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.2-3.28 5.62 0 3.59 2.91 6.5 6.5 6.5s6.5-2.91 6.5-6.5c0-2.42-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM13 32h19v3H13v-3z m2-3h15v2H15v-2zM15 37h15v2H15v-2z"/><path d="M20 10.5v3h5v-3h-5z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></g></svg>,
    q: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 13.5l-3 14h25l-3-14H13zm0 0h19m-19 18.5h19v3H13v-3zm2-3h15v2H15v-2zM15 37h15v2H15v-2z"/><path d="M11 14.5c0-2.5 2-4.5 4.5-4.5S20 12 20 14.5 17.5 19 15 19s-4.5-2-4.5-4.5zm19 0c0-2.5 2-4.5 4.5-4.5S38 12 38 14.5 35.5 19 33 19s-4.5-2-4.5-4.5zM22.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5z"/></g></svg>,
    r: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 36h27v3H9v-3zm3-3h21v2H12v-2zm-1-6h23v5H11v-5zm2-17h19v16H13V10zm2-3h15v2H15V7z"/><path d="M15 7V4h3v3h-3zm6 0V4h3v3h-3zm6 0V4h3v3h-3z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></g></svg>,
    b: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 32c2.5 2.5 12.5 2.5 15 0-1.5-1.5-2.5-3-2.5-3-2.5-2-5-3.5-5-3.5-1.5 1.5-2.5 2.5-2.5 2.5s-1 1.5-2.5 3zM22.5 8c-2.48 0-4.5 2.02-4.5 4.5S20.02 17 22.5 17s4.5-2.02 4.5-4.5S24.98 8 22.5 8zm0 2c1.38 0 2.5 1.12 2.5 2.5S23.88 15 22.5 15 20 13.88 20 12.5 21.12 10 22.5 10z"/><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.43-13.5-2-3.39 2.43-10.11 1.03-13.5 2 0 0-1.65.54-3 2-.68.97-1.65.99-3-.5z"/><path d="M22.5 17s-5.5 3.5-5.5 10.5h11C28 20.5 22.5 17 22.5 17z"/></g></svg>,
    n: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22,10c10.5,1,11.5,8,11.5,10.5C33.5,22.5,32,24,32,24c-2.5,0-4-1.5-4-4,0-2,1.5-3.5,1.5-6.5-1.5,1.5-3,3-4.5,5.5-1,2-2.5,3-2.5,5,0,2.5,2.5,4.5,2.5,4.5H10v-5c0-4.5,2-6.5,2-9.5-1-2-1-4-1-6,0-2.5,1.5-4,2.5-4s2,1.5,2,4-1,2.5-1,5c0,2.5,2.5,5,2.5,5s-3.5-3-3.5-7c0-4,3-6.5,5-6.5z"/><path d="M11.5 37.5c5.5 3.5 16.5 3.5 22 0v-7s-2 1.5-11 1.5-11-1.5-11-1.5v7zM11.5 30.5c5.5-3 16.5-3 22 0"/></g></svg>,
    p: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.5 10c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zM14 36h17v3H14v-3zm1-3h15v2H15v-2zM15 31h15v2H15v-2z m0-3c-3.86 0-7 3.14-7 7h29c0-3.86-3.14-7-7-7H15z"/></g></svg>,
  },
  b: {
    k: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.2-3.28 5.62 0 3.59 2.91 6.5 6.5 6.5s6.5-2.91 6.5-6.5c0-2.42-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM13 32h19v3H13v-3z m2-3h15v2H15v-2zM15 37h15v2H15v-2z"/><path d="M20 10.5v3h5v-3h-5z" fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></g></svg>,
    q: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 13.5l-3 14h25l-3-14H13zm0 0h19m-19 18.5h19v3H13v-3zm2-3h15v2H15v-2zM15 37h15v2H15v-2z"/><path d="M11 14.5c0-2.5 2-4.5 4.5-4.5S20 12 20 14.5 17.5 19 15 19s-4.5-2-4.5-4.5zm19 0c0-2.5 2-4.5 4.5-4.5S38 12 38 14.5 35.5 19 33 19s-4.5-2-4.5-4.5zM22.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5z"/></g></svg>,
    r: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 36h27v3H9v-3zm3-3h21v2H12v-2zm-1-6h23v5H11v-5zm2-17h19v16H13V10zm2-3h15v2H15V7z"/><path d="M15 7V4h3v3h-3zm6 0V4h3v3h-3zm6 0V4h3v3h-3z" fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></g></svg>,
    b: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 32c2.5 2.5 12.5 2.5 15 0-1.5-1.5-2.5-3-2.5-3-2.5-2-5-3.5-5-3.5-1.5 1.5-2.5 2.5-2.5 2.5s-1 1.5-2.5 3zM22.5 8c-2.48 0-4.5 2.02-4.5 4.5S20.02 17 22.5 17s4.5-2.02 4.5-4.5S24.98 8 22.5 8zm0 2c1.38 0 2.5 1.12 2.5 2.5S23.88 15 22.5 15 20 13.88 20 12.5 21.12 10 22.5 10z"/><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.43-13.5-2-3.39 2.43-10.11 1.03-13.5 2 0 0-1.65.54-3 2-.68.97-1.65.99-3-.5z"/><path d="M22.5 17s-5.5 3.5-5.5 10.5h11C28 20.5 22.5 17 22.5 17z"/></g></svg>,
    n: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22,10c10.5,1,11.5,8,11.5,10.5C33.5,22.5,32,24,32,24c-2.5,0-4-1.5-4-4,0-2,1.5-3.5,1.5-6.5-1.5,1.5-3,3-4.5,5.5-1,2-2.5,3-2.5,5,0,2.5,2.5,4.5,2.5,4.5H10v-5c0-4.5,2-6.5,2-9.5-1-2-1-4-1-6,0-2.5,1.5-4,2.5-4s2,1.5,2,4-1,2.5-1,5c0,2.5,2.5,5,2.5,5s-3.5-3-3.5-7c0-4,3-6.5,5-6.5z"/><path d="M11.5 37.5c5.5 3.5 16.5 3.5 22 0v-7s-2 1.5-11 1.5-11-1.5-11-1.5v7zM11.5 30.5c5.5-3 16.5-3 22 0"/></g></svg>,
    p: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.5 10c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zM14 36h17v3H14v-3zm1-3h15v2H15v-2zM15 31h15v2H15v-2z m0-3c-3.86 0-7 3.14-7 7h29c0-3.86-3.14-7-7-7H15z"/></g></svg>,
  }
};

export const ChessPiece: FC<ChessPieceProps> = ({ piece, className }) => {
  if (!piece) return null;
  const PieceComponent = pieceMap[piece.color][piece.type];
  if (!PieceComponent) return null;
  
  return <PieceComponent className={cn("w-full h-full p-1 drop-shadow-lg", className)} />;
};
