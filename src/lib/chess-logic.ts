'use client';
import { suggestMove, analyzePosition } from '@/ai/flows/index';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PlayerColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PlayerColor;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  promotion?: PieceType;
}

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export class ChessGame {
  private board: (Piece | null)[][];
  turn: PlayerColor;
  private castlingRights: { w: { k: boolean; q: boolean }; b: { k: boolean; q: boolean } };
  private enPassantTarget: Position | null;
  private halfmoveClock: number;
  private fullmoveNumber: number;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  gameOver: boolean;

  constructor(fen: string = STARTING_FEN) {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    this.turn = 'w';
    this.castlingRights = { w: { k: false, q: false }, b: { k: false, q: false } };
    this.enPassantTarget = null;
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
    this.isCheck = false;
    this.isCheckmate = false;
    this.isStalemate = false;
    this.gameOver = false;
    this.load(fen);
  }

  load(fen: string) {
    const [placement, turn, castling, enPassant, halfmove, fullmove] = fen.split(' ');
    
    // 1. Board placement
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    let row = 0, col = 0;
    for (const char of placement) {
      if (char === '/') {
        row++;
        col = 0;
      } else if (/\d/.test(char)) {
        col += parseInt(char, 10);
      } else {
        this.board[row][col] = {
          type: char.toLowerCase() as PieceType,
          color: char === char.toUpperCase() ? 'w' : 'b',
        };
        col++;
      }
    }

    // 2. Turn
    this.turn = turn as PlayerColor;
    
    // 3. Castling
    this.castlingRights = { w: { k: castling.includes('K'), q: castling.includes('Q') }, b: { k: castling.includes('k'), q: castling.includes('q') } };

    // 4. En-passant
    if (enPassant !== '-') {
      this.enPassantTarget = this.algebraicToPos(enPassant);
    } else {
      this.enPassantTarget = null;
    }
    
    // 5. Halfmove clock
    this.halfmoveClock = parseInt(halfmove, 10);

    // 6. Fullmove number
    this.fullmoveNumber = parseInt(fullmove, 10);

    this.updateStatus();
  }

  fen(): string {
    let fen = '';
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece) {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          fen += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
        } else {
          empty++;
        }
      }
      if (empty > 0) {
        fen += empty;
      }
      if (r < 7) {
        fen += '/';
      }
    }

    fen += ` ${this.turn}`;

    let castling = '';
    if (this.castlingRights.w.k) castling += 'K';
    if (this.castlingRights.w.q) castling += 'Q';
    if (this.castlingRights.b.k) castling += 'k';
    if (this.castlingRights.b.q) castling += 'q';
    fen += ` ${castling || '-'}`;
    
    fen += ` ${this.enPassantTarget ? this.posToAlgebraic(this.enPassantTarget) : '-'}`;
    fen += ` ${this.halfmoveClock}`;
    fen += ` ${this.fullmoveNumber}`;

    return fen;
  }

  getBoard = () => this.board;
  
  get = (pos: Position) => this.board[pos.row][pos.col];
  
  private set = (pos: Position, piece: Piece | null) => this.board[pos.row][pos.col] = piece;

  move(move: Move | string): boolean {
    let from: Position, to: Position, promotion: PieceType | undefined;
    if (typeof move === 'string') {
        const parsedMove = this.parseAlgebraicMove(move);
        if (!parsedMove) return false;
        from = parsedMove.from;
        to = parsedMove.to;
        promotion = parsedMove.promotion;
    } else {
        from = move.from;
        to = move.to;
        promotion = move.promotion;
    }

    const piece = this.get(from);
    if (!piece || piece.color !== this.turn) {
      return false;
    }

    const validMoves = this.getValidMoves(from);
    if (!validMoves.some(m => m.row === to.row && m.col === to.col)) {
      return false;
    }
    
    const capturedPiece = this.get(to);

    // Halfmove clock reset
    if (piece.type === 'p' || capturedPiece) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }
    
    // Update board
    this.set(to, piece);
    this.set(from, null);

    // En passant
    if (piece.type === 'p' && Math.abs(from.row - to.row) === 2) {
      this.enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
    } else {
        if (piece.type === 'p' && this.enPassantTarget && to.row === this.enPassantTarget.row && to.col === this.enPassantTarget.col) {
            const capturedPawnPos = {row: from.row, col: to.col};
            this.set(capturedPawnPos, null);
        }
      this.enPassantTarget = null;
    }

    // Castling move
    if (piece.type === 'k' && Math.abs(from.col - to.col) === 2) {
        const rookFromCol = to.col > from.col ? 7 : 0;
        const rookToCol = to.col > from.col ? 5 : 3;
        const rook = this.get({row: from.row, col: rookFromCol});
        this.set({row: from.row, col: rookToCol}, rook);
        this.set({row: from.row, col: rookFromCol}, null);
    }
    
    // Update castling rights
    if (piece.type === 'k') {
        this.castlingRights[piece.color].k = false;
        this.castlingRights[piece.color].q = false;
    }
    if (piece.type === 'r') {
        if (from.col === 0 && from.row === (piece.color === 'w' ? 7 : 0)) this.castlingRights[piece.color].q = false;
        if (from.col === 7 && from.row === (piece.color === 'w' ? 7 : 0)) this.castlingRights[piece.color].k = false;
    }
    if (capturedPiece?.type === 'r') {
        const opponentColor = this.turn === 'w' ? 'b' : 'w';
        if (to.col === 0 && to.row === (opponentColor === 'w' ? 7 : 0)) this.castlingRights[opponentColor].q = false;
        if (to.col === 7 && to.row === (opponentColor === 'w' ? 7 : 0)) this.castlingRights[opponentColor].k = false;
    }

    // Promotion
    if (piece.type === 'p' && (to.row === 0 || to.row === 7)) {
      this.set(to, { type: promotion || 'q', color: piece.color });
    }

    if (this.turn === 'b') {
      this.fullmoveNumber++;
    }
    this.turn = this.turn === 'w' ? 'b' : 'w';
    
    this.updateStatus();
    return true;
  }

  private updateStatus() {
    this.isCheck = this.isKingInCheck(this.turn);
    
    const hasLegalMoves = this.getAllValidMoves(this.turn).length > 0;

    if (!hasLegalMoves) {
        if (this.isCheck) {
            this.isCheckmate = true;
        } else {
            this.isStalemate = true;
        }
        this.gameOver = true;
    } else {
        this.isCheckmate = false;
        this.isStalemate = false;
        this.gameOver = false;
    }
  }

  private isKingInCheck(color: PlayerColor) {
    const kingPos = this.findKing(color);
    if (!kingPos) return true; // Should not happen in a real game
    const opponentColor = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(kingPos, opponentColor);
  }
  
  private findKing(color: PlayerColor): Position | null {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.get({row: r, col: c});
        if (piece && piece.type === 'k' && piece.color === color) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  isSquareAttacked(pos: Position, byColor: PlayerColor) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.get({row: r, col: c});
        if (piece && piece.color === byColor) {
          const moves = this.getPieceMoves({row: r, col: c}, true, true);
          if (moves.some(m => m.row === pos.row && m.col === pos.col)) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  getValidMoves(pos: Position): Position[] {
    const piece = this.get(pos);
    if (!piece || piece.color !== this.turn) return [];
    
    const pseudoLegalMoves = this.getPieceMoves(pos);
    
    // Filter out moves that leave the king in check
    return pseudoLegalMoves.filter(to => {
      const captured = this.get(to);
      const pieceAtFrom = this.get(pos); // re-get piece
      if(!pieceAtFrom) return false;

      this.set(to, pieceAtFrom);
      this.set(pos, null);

      const isKingSafe = !this.isKingInCheck(pieceAtFrom.color);
      
      this.set(pos, pieceAtFrom);
      this.set(to, captured);
      
      return isKingSafe;
    });
  }

  private getAllValidMoves(color: PlayerColor): Move[] {
    if (this.turn !== color) return []; // Optimization
    const moves: Move[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.get({row: r, col: c});
        if (piece && piece.color === color) {
          const validMoves = this.getValidMoves({row: r, col: c});
          validMoves.forEach(to => moves.push({from: {row: r, col: c}, to}));
        }
      }
    }
    return moves;
  }
  
  private getPieceMoves(pos: Position, ignoreTurn: boolean = false, forAttackCheck: boolean = false): Position[] {
    const piece = this.get(pos);
    if (!piece) return [];
    if (piece.color !== this.turn && !ignoreTurn) return [];

    const moves: Position[] = [];
    const { row, col } = pos;
    const { type, color } = piece;

    const addMove = (r: number, c: number) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const targetPiece = this.get({row: r, col: c});
        if (!targetPiece || targetPiece.color !== color) {
          moves.push({ row: r, col: c });
        }
        return !targetPiece;
      }
      return false;
    };
    
    const addCaptureMove = (r: number, c: number) => {
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const targetPiece = this.get({row: r, col: c});
            if (targetPiece && targetPiece.color !== color) {
                moves.push({ row: r, col: c });
            } else if (this.enPassantTarget && r === this.enPassantTarget.row && c === this.enPassantTarget.col) {
                moves.push({row:r, col:c});
            }
        }
    }
    
    const addPawnMove = (r: number, c: number) => {
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && !this.get({row: r, col: c})) {
            moves.push({ row: r, col: c });
        }
    }

    if (type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      // Forward
      if (!forAttackCheck) {
        addPawnMove(row + dir, col);
         // Double move
        if (row === startRow && !this.get({row: row + dir, col})) {
            addPawnMove(row + 2 * dir, col);
        }
      }
      // Captures
      addCaptureMove(row + dir, col - 1);
      addCaptureMove(row + dir, col + 1);
    }

    if (type === 'r' || type === 'q') {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        for (let i = 1; i < 8; i++) {
          if (!addMove(row + i * dr, col + i * dc)) break;
        }
      }
    }

    if (type === 'b' || type === 'q') {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        for (let i = 1; i < 8; i++) {
          if (!addMove(row + i * dr, col + i * dc)) break;
        }
      }
    }

    if (type === 'n') {
      const D = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      D.forEach(([dr, dc]) => addMove(row + dr, col + dc));
    }

    if (type === 'k') {
      const D = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
      D.forEach(([dr, dc]) => addMove(row + dr, col + dc));
      // Castling
      if (!forAttackCheck) {
        if (!this.isKingInCheck(color)) {
            // Kingside
            if (this.castlingRights[color].k && !this.get({row, col: 5}) && !this.get({row, col: 6}) && !this.isSquareAttacked({row, col: 5}, color === 'w' ? 'b' : 'w') && !this.isSquareAttacked({row, col: 6}, color === 'w' ? 'b' : 'w')) {
                moves.push({row, col: 6});
            }
            // Queenside
            if (this.castlingRights[color].q && !this.get({row, col: 3}) && !this.get({row, col: 2}) && !this.get({row, col: 1}) && !this.isSquareAttacked({row, col: 3}, color === 'w' ? 'b' : 'w') && !this.isSquareAttacked({row, col: 2}, color === 'w' ? 'b' : 'w')) {
                moves.push({row, col: 2});
            }
        }
      }
    }

    return moves;
  }
  
  algebraicToPos(alg: string): Position {
    const col = alg.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(alg.substring(1), 10);
    return { row, col };
  }

  posToAlgebraic(pos: Position): string {
    return String.fromCharCode('a'.charCodeAt(0) + pos.col) + (8 - pos.row);
  }

  parseAlgebraicMove(moveStr: string): Move | null {
    // This is a simplified parser e.g. 'e2e4' or 'e7e8q' for promotion
    if (moveStr.length < 4 || moveStr.length > 5) return null;
    
    const fromStr = moveStr.substring(0, 2);
    const toStr = moveStr.substring(2, 4);
    
    if (/[a-h][1-8]/.test(fromStr) && /[a-h][1-8]/.test(toStr)) {
        const from = this.algebraicToPos(fromStr);
        const to = this.algebraicToPos(toStr);
        let promotion;
        if (moveStr.length === 5) {
            promotion = moveStr.charAt(4) as PieceType;
            if (!['q', 'r', 'b', 'n'].includes(promotion)) return null;
        }
        return { from, to, promotion };
    }
    return null;
  }

  moveToString(move: Move): string {
    return `${this.posToAlgebraic(move.from)}${this.posToAlgebraic(move.to)}${move.promotion || ''}`;
  }

  // AI Integration
  async getAIBestMove(powerLevel: number): Promise<string | null> {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const response = await suggestMove({ boardState: this.fen(), powerLevel });
        const parsedMove = this.parseAlgebraicMove(response.move);
        
        if (parsedMove) {
          const piece = this.get(parsedMove.from);
          if (piece && piece.color === this.turn) {
            const validMoves = this.getValidMoves(parsedMove.from);
            if (validMoves.some(m => m.row === parsedMove.to.row && m.col === parsedMove.to.col)) {
              return response.move; // Valid move found
            }
          }
        }
      } catch (error) {
        console.error(`AI move suggestion attempt ${attempts + 1} failed:`, error);
      }
      attempts++;
    }
    console.error("AI failed to provide a valid move after 3 attempts.");
    // As a fallback, return the first valid move for the AI
    const allMoves = this.getAllValidMoves(this.turn);
    if (allMoves.length > 0) {
      return this.moveToString(allMoves[0]);
    }
    return null;
  }

  async getAIBestMoveWithReason(powerLevel: number): Promise<{ move: string; reason: string }> {
      const boardState = this.fen();
      const currentTurn = boardState.split(' ')[1];
      if (currentTurn === 'w') { // Hint is for the white player
         return await suggestMove({ boardState, powerLevel });
      }
      return { move: 'N/A', reason: "Hints are only available on your turn." };
  }

  async analyzePosition() {
    return await analyzePosition({ fen: this.fen() });
  }
}
