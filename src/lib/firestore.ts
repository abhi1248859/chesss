import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { nanoid } from 'nanoid';
import type { User } from 'firebase/auth';

// This function now creates a default user object, so it doesn't need a logged-in user.
export async function createGame(): Promise<string> {
    const gameId = nanoid(8);
    const gameRef = doc(db, 'games', gameId);
    
    const user = {
        uid: `guest_${nanoid(10)}`,
        displayName: 'Guest Player',
        photoURL: ''
    };

    await setDoc(gameRef, {
        gameId,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moveHistory: [],
        player1: {
            uid: user.uid,
            name: user.displayName,
            photoURL: user.photoURL
        },
        player2: null,
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

export async function joinGame(gameId: string): Promise<boolean> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    const user = {
        uid: `guest_${nanoid(10)}`,
        displayName: 'Guest Player 2',
        photoURL: ''
    };

    if (gameSnap.exists() && !gameSnap.data().player2) {
        await updateDoc(gameRef, {
            player2: {
                uid: user.uid,
                name: user.displayName,
                photoURL: user.photoURL
            },
            status: 'active',
            updatedAt: serverTimestamp()
        });
        return true;
    }
    return false; // Game not found or already full
}


export async function offerRematch(gameId: string, userId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
        'rematch.offeredBy': userId,
    });
}

// This function needs the user data from the game document itself now
export async function acceptRematch(gameId: string, oldGameData: any): Promise<void> {
    const newGameId = nanoid(8);
    const newGameRef = doc(db, 'games', newGameId);
    
    // Create a new game with players from the old game.
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
