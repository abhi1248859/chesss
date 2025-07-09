import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { nanoid } from 'nanoid';
import type { User } from 'firebase/auth';

export async function createGame(user: User): Promise<string> {
    const gameId = nanoid(8);
    const gameRef = doc(db, 'games', gameId);
    await setDoc(gameRef, {
        gameId,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moveHistory: [],
        player1: {
            uid: user.uid,
            name: user.displayName || 'Player 1',
            photoURL: user.photoURL
        },
        player2: null,
        status: 'waiting', // waiting, active, finished
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

export async function joinGame(gameId: string, user: User): Promise<boolean> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (gameSnap.exists() && !gameSnap.data().player2 && gameSnap.data().player1.uid !== user.uid) {
        await updateDoc(gameRef, {
            player2: {
                uid: user.uid,
                name: user.displayName || 'Player 2',
                photoURL: user.photoURL
            },
            status: 'active',
            updatedAt: serverTimestamp()
        });
        return true;
    }
    return false; // Game not found, already full, or user trying to join their own game
}


export async function offerRematch(gameId: string, userId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
        'rematch.offeredBy': userId,
    });
}

export async function acceptRematch(gameId: string, oldGameData: any, acceptingUser: User): Promise<void> {
    const opponent = oldGameData.player1.uid === acceptingUser.uid ? oldGameData.player2 : oldGameData.player1;

    // The user accepting the rematch becomes player 1 in the new game (swapping colors)
    const newGameId = await createGame(acceptingUser);
    const newGameRef = doc(db, 'games', newGameId);

    // Immediately add the opponent as player 2
    await updateDoc(newGameRef, {
        player2: opponent,
        status: 'active',
        updatedAt: serverTimestamp()
    });

    // Update old game to point to the new one, signaling both clients to switch
    const oldGameRef = doc(db, 'games', gameId);
    await updateDoc(oldGameRef, {
        'rematch.newGameId': newGameId
    });
}
