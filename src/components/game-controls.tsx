'use client';

import { FC, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { BrainCircuit, RotateCcw, Search, Wand2, Loader2, Info, History } from 'lucide-react';

interface GameControlsProps {
  status: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  onDifficultyChange: (value: 'Easy' | 'Medium' | 'Hard') => void;
  onNewGame: () => void;
  onUndo: () => void;
  onAnalysis: () => void;
  onSuggestion: () => void;
  analysisResult: string;
  suggestionResult: { move: string; reason: string } | null;
  isLoading: { analysis: boolean; suggestion: boolean };
  fenHistory: string[];
  moveHistory: string[];
  isAITurn?: boolean;
}

const GameControls: FC<GameControlsProps> = ({
  status,
  difficulty,
  onDifficultyChange,
  onNewGame,
  onUndo,
  onAnalysis,
  onSuggestion,
  analysisResult,
  suggestionResult,
  isLoading,
  fenHistory,
  moveHistory,
  isAITurn,
}) => {
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

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BrainCircuit /> Tactical Intellect</CardTitle>
        <CardDescription>Status: {status}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={onNewGame} disabled={isAITurn}>
            <Wand2 className="mr-2 h-4 w-4" /> New Game
          </Button>
          <Button onClick={onUndo} variant="outline" disabled={fenHistory.length < 3 || isAITurn}>
            <RotateCcw className="mr-2 h-4 w-4" /> Undo
          </Button>
        </div>
        
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={difficulty} onValueChange={onDifficultyChange} disabled={isAITurn}>
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />

        <div className="space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2"><History /> Move History</h3>
          <ScrollArea className="h-24 w-full rounded-md border p-2 bg-muted/30">
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

        <Separator />

        <div>
          <h3 className="font-semibold mb-2 text-sm">AI Assistance</h3>
          <div className="flex items-center gap-4">
            <Button onClick={onAnalysis} className="w-full" variant="secondary" disabled={isLoading.analysis || isAITurn}>
              {isLoading.analysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Analyze
            </Button>
            <Button onClick={onSuggestion} className="w-full" variant="secondary" disabled={isLoading.suggestion || isAITurn}>
               {isLoading.suggestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Info className="mr-2 h-4 w-4" />}
              Hint
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-40 w-full rounded-md border p-4 bg-muted/30 flex-grow">
            {isLoading.analysis && <p className="text-sm text-muted-foreground animate-pulse">Analyzing position...</p>}
            {analysisResult && (
                <div>
                    <h4 className="font-bold text-accent mb-2">Analysis</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult}</p>
                </div>
            )}
             {isLoading.suggestion && !suggestionResult && <p className="text-sm text-muted-foreground animate-pulse">Getting hint...</p>}
            {suggestionResult && (
                <div className={analysisResult ? "mt-4" : ""}>
                    <h4 className="font-bold text-accent mb-2">Suggested Move: {suggestionResult.move}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{suggestionResult.reason}</p>
                </div>
            )}
            {!isLoading.analysis && !analysisResult && !isLoading.suggestion && !suggestionResult && (
                <p className="text-sm text-center text-muted-foreground pt-12">Use AI assistance to get hints or analysis of the position.</p>
            )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
            Developed for a world-class chess experience.
        </p>
      </CardFooter>
    </Card>
  );
};

export default GameControls;
