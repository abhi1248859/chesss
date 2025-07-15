import type { FC } from 'react';
import type { Piece } from '@/lib/chess-logic';
import { cn } from '@/lib/utils';

interface ChessPieceProps {
  piece: Piece;
  className?: string;
}

const pieceMap = {
  w: {
    k: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.5,11.63V6M20,8h5"/><path d="M22.5,25s4.5-7.5,3-10.5c0,0-1.5-3-3-3s-3,3-3,3c-1.5,3,3,10.5,3,10.5"/><path d="M11.5,37c5.5,3.5,16.5,3.5,22,0v-7s-2,1.5-11,1.5S11.5,30,11.5,30V37z"/><path d="M11.5,30c5.5-3,16.5-3,22,0"/><path d="M11.5,30s-1.5-2.5-1.5-4,1.5-2.5,1.5-4-1.5-2.5-1.5-4,1.5-2,1.5-3.5-1.5-2.5-1.5-4,1.5-2.5,1.5-4"/><path d="M33.5,30s1.5-2.5,1.5-4-1.5-2.5-1.5-4,1.5-2.5,1.5-4-1.5-2-1.5-3.5,1.5-2.5,1.5-4-1.5-2.5-1.5-4"/><path d="M11.5,37.5s-2-1-2-3.5c0-2.5,2-3.5,2-3.5"/><path d="M33.5,37.5s2-1,2-3.5c0-2.5-2-3.5-2-3.5"/></g></svg>,
    q: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5,13.5l-3,14H35.5l-3-14"/><path d="M12.5,13.5h20"/><path d="M11.5,37c5.5,3.5,16.5,3.5,22,0v-7s-2,1.5-11,1.5S11.5,30,11.5,30V37z"/><path d="M11.5,30c5.5-3,16.5-3,22,0"/><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/></g></svg>,
    r: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9,39h27v-3H9v3zM12.5,32l1.5-2.5h17l1.5,2.5h-20zM12,36v-4h21v4H12z"/><path d="M14,29.5v-13h17v13H14z"/><path d="M14,16.5l3-2.5h11l3,2.5H14z"/><path d="M11,14V9h4v2h5V9h5v2h5V9h4v5H11z"/></g></svg>,
    b: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9,36c3.39-0.97,10.11,0.43,13.5-2,3.39,2.43,10.11,1.03,13.5,2,0,0,1.65,0.54,3,2-0.68,0.97-1.65,0.99-3,0.5-3.39-0.97-10.11,0.43-13.5-2-3.39,2.43-10.11,1.03-13.5,2,0,0-1.65,0.54-3,2-0.68,0.97-1.65,0.99-3-0.5z"/><path d="M15,32c2.5,2.5,12.5,2.5,15,0-1.5-1.5-2.5-3-2.5-3-2.5-2-5-3.5-5-3.5-1.5,1.5-2.5,2.5-2.5,2.5s-1,1.5-2.5,3z"/><path d="M22.5,15.5c4.42,0,8,3.58,8,8s-3.58,8-8,8-8-3.58-8-8,3.58-8,8-8z"/><path d="M20.5,14.5l-2-2.5h8l-2,2.5z"/></g></svg>,
    n: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22,10c10.5,1,11.5,8,11.5,10.5,0,2-1.5,4-4.5,4-2.5,0-4-1.5-4-4,0-2,1.5-3.5,1.5-6.5-1.5,1.5-3,3-4.5,5.5-1,2-2.5,3-2.5,5,0,2.5,2.5,4.5,2.5,4.5H10v-5c0-4.5,2-6.5,2-9.5-1-2-1-4-1-6,0-2.5,1.5-4,2.5-4s2,1.5,2,4-1,2.5-1,5c0,2.5,2.5,5,2.5,5"/><path d="M11.5,37c5.5,3.5,16.5,3.5,22,0v-7s-2,1.5-11,1.5S11.5,30,11.5,30V37z"/><path d="M11.5,30c5.5-3,16.5-3,22,0"/></g></svg>,
    p: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.5,9.5c3.31,0,6,2.69,6,6s-2.69,6-6,6s-6-2.69-6-6,2.69-6,6-6zM14.5,34.5h16v-2.5c0-4.42-3.58-8-8-8s-8,3.58-8,8v2.5zM14.5,37h16v-2.5H14.5V37z"/></g></svg>,
  },
  b: {
    k: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.5,11.63V6M20,8h5"/><path d="M22.5,25s4.5-7.5,3-10.5c0,0-1.5-3-3-3s-3,3-3,3c-1.5,3,3,10.5,3,10.5"/><path d="M11.5,37c5.5,3.5,16.5,3.5,22,0v-7s-2,1.5-11,1.5S11.5,30,11.5,30V37z"/><path d="M11.5,30c5.5-3,16.5-3,22,0"/><path d="M11.5,30s-1.5-2.5-1.5-4,1.5-2.5,1.5-4-1.5-2.5-1.5-4,1.5-2,1.5-3.5-1.5-2.5-1.5-4,1.5-2.5,1.5-4"/><path d="M33.5,30s1.5-2.5,1.5-4-1.5-2.5-1.5-4,1.5-2.5,1.5-4-1.5-2-1.5-3.5,1.5-2.5,1.5-4-1.5-2.5-1.5-4"/><path d="M11.5,37.5s-2-1-2-3.5c0-2.5,2-3.5,2-3.5"/><path d="M33.5,37.5s2-1,2-3.5c0-2.5-2-3.5-2-3.5"/></g></svg>,
    q: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5,13.5l-3,14H35.5l-3-14"/><path d="M12.5,13.5h20"/><path d="M11.5,37c5.5,3.5,16.5,3.5,22,0v-7s-2,1.5-11,1.5S11.5,30,11.5,30V37z"/><path d="M11.5,30c5.5-3,16.5-3,22,0"/><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/></g></svg>,
    r: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9,39h27v-3H9v3zM12.5,32l1.5-2.5h17l1.5,2.5h-20zM12,36v-4h21v4H12z"/><path d="M14,29.5v-13h17v13H14z"/><path d="M14,16.5l3-2.5h11l3,2.5H14z"/><path d="M11,14V9h4v2h5V9h5v2h5V9h4v5H11z"/></g></svg>,
    b: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9,36c3.39-0.97,10.11,0.43,13.5-2,3.39,2.43,10.11,1.03,13.5,2,0,0,1.65,0.54,3,2-0.68,0.97-1.65,0.99-3,0.5-3.39-0.97-10.11,0.43-13.5-2-3.39,2.43-10.11,1.03-13.5,2,0,0-1.65,0.54-3,2-0.68,0.97-1.65,0.99-3-0.5z"/><path d="M15,32c2.5,2.5,12.5,2.5,15,0-1.5-1.5-2.5-3-2.5-3-2.5-2-5-3.5-5-3.5-1.5,1.5-2.5,2.5-2.5,2.5s-1,1.5-2.5,3z"/><path d="M22.5,15.5c4.42,0,8,3.58,8,8s-3.58,8-8,8-8-3.58-8-8,3.58-8,8-8z"/><path d="M20.5,14.5l-2-2.5h8l-2,2.5z"/></g></svg>,
    n: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22,10c10.5,1,11.5,8,11.5,10.5,0,2-1.5,4-4.5,4-2.5,0-4-1.5-4-4,0-2,1.5-3.5,1.5-6.5-1.5,1.5-3,3-4.5,5.5-1,2-2.5,3-2.5,5,0,2.5,2.5,4.5,2.5,4.5H10v-5c0-4.5,2-6.5,2-9.5-1-2-1-4-1-6,0-2.5,1.5-4,2.5-4s2,1.5,2,4-1,2.5-1,5c0,2.5,2.5,5,2.5,5"/><path d="M11.5,37c5.5,3.5,16.5,3.5,22,0v-7s-2,1.5-11,1.5S11.5,30,11.5,30V37z"/><path d="M11.5,30c5.5-3,16.5-3,22,0"/></g></svg>,
    p: (p: {className?: string}) => <svg {...p} viewBox="0 0 45 45"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.5,9.5c3.31,0,6,2.69,6,6s-2.69,6-6,6s-6-2.69-6-6,2.69-6,6-6zM14.5,34.5h16v-2.5c0-4.42-3.58-8-8-8s-8,3.58-8,8v2.5zM14.5,37h16v-2.5H14.5V37z"/></g></svg>,
  }
};

export const ChessPiece: FC<ChessPieceProps> = ({ piece, className }) => {
  if (!piece) return null;
  const PieceComponent = pieceMap[piece.color][piece.type];
  if (!PieceComponent) return null;
  
  return <PieceComponent className={cn("w-full h-full p-1 drop-shadow-lg", className)} />;
};
