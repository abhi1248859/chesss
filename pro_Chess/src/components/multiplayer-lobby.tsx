'use client';

import { useState, type FC } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createGame, joinGame } from '@/lib/firestore';
import { Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MultiplayerLobbyProps {
  anonymousId: string;
  onGameCreated: (gameId: string) => void;
  onGameJoined: (gameId: string) => void;
}

const MultiplayerLobby: FC<MultiplayerLobbyProps> = ({ anonymousId, onGameCreated, onGameJoined }) => {
  const [joinCode, setJoinCode] = useState('');
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState({ create: false, join: false });
  const { toast } = useToast();

  const handleCreateGame = async () => {
    if (!anonymousId) {
        toast({ title: "Error", description: "Could not identify player. Please refresh.", variant: "destructive" });
        return;
    }
    setIsLoading(prev => ({ ...prev, create: true }));
    try {
      const newGameId = await createGame(anonymousId);
      setCreatedGameId(newGameId);
      onGameCreated(newGameId);
    } catch (error) {
      console.error("Error creating game:", error);
      toast({ title: "Error", description: "Could not create a game. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleJoinGame = async () => {
    if (!anonymousId) {
        toast({ title: "Error", description: "Could not identify player. Please refresh.", variant: "destructive" });
        return;
    }
    if (!joinCode) {
      toast({ title: "Error", description: "Please enter a game code.", variant: "destructive" });
      return;
    }
    setIsLoading(prev => ({ ...prev, join: true }));
    try {
      const success = await joinGame(joinCode.trim(), anonymousId);
      if (success) {
        toast({ title: "Success!", description: "Joining game..." });
        onGameJoined(joinCode.trim());
      } else {
        toast({ title: "Join Failed", description: "Game not found or is full.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error joining game:", error);
      toast({ title: "Error", description: "Could not join the game. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(prev => ({...prev, join: false }));
    }
  };

  const copyToClipboard = () => {
    if (createdGameId) {
      navigator.clipboard.writeText(createdGameId);
      toast({ title: "Copied!", description: "Game code copied to clipboard." });
    }
  };

  if (createdGameId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center shadow-2xl animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-3xl">Game Created!</CardTitle>
            <CardDescription>Share this code with your friend to play.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center p-2 space-x-2 border rounded-lg bg-muted">
              <p className="flex-1 text-2xl font-mono tracking-widest text-center">{createdGameId}</p>
              <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                <Copy />
              </Button>
            </div>
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="mr-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Waiting for opponent to join...</p>
            </div>
          </CardContent>
          <CardFooter>
            <p className="w-full text-xs text-center text-muted-foreground">
              The match will begin automatically once your friend joins.
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md shadow-2xl animate-fade-in-up">
        <CardHeader>
          <CardTitle className="tracking-tighter">Play with a Friend</CardTitle>
          <CardDescription>Create a new game or join an existing one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button size="lg" className="w-full" onClick={handleCreateGame} disabled={isLoading.create}>
            {isLoading.create ? <Loader2 className="animate-spin" /> : "Create New Game"}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-background text-muted-foreground">Or</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-code">Join with Code</Label>
            <div className="flex gap-2">
              <Input
                id="join-code"
                placeholder="Enter game code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                disabled={isLoading.join}
                onKeyUp={(e) => e.key === 'Enter' && handleJoinGame()}
              />
              <Button onClick={handleJoinGame} disabled={isLoading.join || !joinCode}>
                {isLoading.join ? <Loader2 className="animate-spin" /> : "Join"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiplayerLobby;
