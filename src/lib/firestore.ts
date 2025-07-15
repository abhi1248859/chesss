import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const generatePlayerObject = (id: string, name: string) => ({
    id,
    name: name,
    photoURL: `https://api.dicebear.com/8.x/bottts/svg?seed=${id}`
});

/**
 * Generates a random 6-character alphanumeric string for the game code.
 */
const generateGameCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};


export async function createGame(anonymousId: string): Promise<string> {
    let gameId;
    let exists = true;
    let attempts = 0; // Safety break

    while (exists && attempts < 10) {
        gameId = generateGameCode();
        if (!gameId) { // Just in case generateGameCode returns empty
            attempts++;
            continue;
        }
        const gameRef = doc(db, 'games', gameId);
        const gameSnap = await getDoc(gameRef);
        exists = gameSnap.exists();
        attempts++;
    }

    if (!gameId || (exists && attempts >= 10)) {
        throw new Error("Failed to generate a unique game code.");
    }

    const gameRef = doc(db, 'games', gameId);
    
    await setDoc(gameRef, {
        gameId,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moveHistory: [],
        player1: generatePlayerObject(anonymousId, 'Player 1'),
        player2: { id: null, name: 'Waiting...', photoURL: '' }, // Initial placeholder for player2
        status: 'waiting',
        turn: 'w',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        rematch: {
            offeredBy: null,
            newGameId: null,
        }
    });
    return gameId;
}

export async function joinGame(gameId: string, anonymousId: string): Promise<boolean> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (gameSnap.exists() && gameSnap.data().status === 'waiting') {
        await updateDoc(gameRef, {
            player2: generatePlayerObject(anonymousId, 'Player 2'),
            status: 'active',
            updatedAt: serverTimestamp()
        });
        return true;
    }
    return false; // Game not found or already full
}


export async function offerRematch(gameId: string, anonymousId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
        'rematch.offeredBy': anonymousId,
    });
}

// This function needs the user data from the game document itself now
export async function acceptRematch(gameId: string, oldGameData: any, myAnonymousId: string): Promise<void> {
    
    let newGameId;
    let exists = true;
    let attempts = 0; // Safety break
    
    // Loop until a unique gameId is found for the new game
    while(exists && attempts < 10) {
        newGameId = generateGameCode();
        if (!newGameId) {
            attempts++;
            continue;
        }
        const gameRef = doc(db, 'games', newGameId);
        const gameSnap = await getDoc(gameRef);
        exists = gameSnap.exists();
        attempts++;
    }

    if (!newGameId || (exists && attempts >= 10)) {
        throw new Error("Failed to generate a unique game code for rematch.");
    }

    const newGameRef = doc(db, 'games', newGameId);
    
    // Create a new game with players from the old game.
    // The player accepting the rematch is now player 2
    await setDoc(newGameRef, {
        gameId: newGameId,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moveHistory: [],
        // Swap players for the rematch
        player1: oldGameData.player2,
        player2: oldGameData.player1,
        status: 'active',
        turn: 'w',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        rematch: { offeredBy: null, newGameId: null }
    });


    // Update old game to point to the new one, signaling both clients to switch
    const oldGameRef = doc(db, 'games', gameId);
    await updateDoc(oldGameRef, {
        'rematch.newGameId': newGameId
    });
}
