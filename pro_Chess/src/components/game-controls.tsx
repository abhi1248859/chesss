'use client';

import { FC, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { BrainCircuit, RotateCcw, Search, Wand2, Loader2, Info, History, Home, Zap, ShieldAlert, Target } from 'lucide-react';
import type { AnalyzePositionOutput } from '@/ai/flows/analyze-position';

interface GameControlsProps {
  status: string;
  difficulty: number;
  onDifficultyChange: (value: number) => void;
  onNewGame: () => void;
  onUndo: () => void;
  onAnalysis: () => void;
  onSuggestion: () => void;
  analysisResult: AnalyzePositionOutput | null;
  suggestionResult: { move: string; reason: string } | null;
  isLoading: { analysis: boolean; suggestion: boolean };
  fenHistory: string[];
  moveHistory: string[];
  isAITurn?: boolean;
  onBackToMenu: () => void;
}

const getPowerLevelLabel = (powerLevel: number) => {
    if (powerLevel <= 10) return 'Beginner';
    if (powerLevel <= 20) return 'Casual';
    if (powerLevel <= 30) return 'Intermediate';
    if (powerLevel <= 40) return 'Good Player';
    if (powerLevel <= 50) return 'Advanced';
    if (powerLevel <= 60) return 'Tactical AI';
    if (powerLevel <= 80) return 'Strong Engine';
    if (powerLevel <= 99) return 'Brutal Engine';
    return 'Full Power AI 🔥';
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
  onBackToMenu,
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
  
  const difficultyLabel = getPowerLevelLabel(difficulty);

  const renderMarkdownList = (markdown: string) => {
    return markdown.split('*').filter(s => s.trim()).map((item, index) => (
        <li key={index} className="flex gap-2 items-start">
            <span className="text-accent mt-1">▶</span>
            <span>{item.trim()}</span>
        </li>
    ));
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BrainCircuit /> Game Status</CardTitle>
        <CardDescription>{status}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onNewGame} disabled={isAITurn}>
            <Wand2 className="mr-2 h-4 w-4" /> Reset Game
          </Button>
          <Button onClick={onUndo} variant="outline" disabled={fenHistory.length < 3 || isAITurn}>
            <RotateCcw className="mr-2 h-4 w-4" /> Undo
          </Button>
        </div>
        
        <div className="space-y-3 pt-2">
          <Label htmlFor="difficulty-slider" className="flex justify-between items-center">
            <span className="text-sm">Difficulty: {difficultyLabel}</span>
            <span className="text-muted-foreground font-mono">{difficulty}/100</span>
          </Label>
          <Slider
            id="difficulty-slider"
            min={0}
            max={100}
            step={1}
            value={[difficulty]}
            onValueChange={(value) => onDifficultyChange(value[0])}
            disabled={isAITurn}
          />
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
        
        <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted/30 flex-grow">
            {isLoading.analysis && <p className="text-sm text-muted-foreground animate-pulse">Analyzing position...</p>}
            {analysisResult && (
                <div className="space-y-4 text-sm">
                    <div>
                        <h4 className="font-bold text-accent mb-2 flex items-center gap-2"><Zap /> Strengths</h4>
                        <ul className="space-y-1 list-inside text-muted-foreground">{renderMarkdownList(analysisResult.strengths)}</ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-destructive mb-2 flex items-center gap-2"><ShieldAlert /> Weaknesses</h4>
                        <ul className="space-y-1 list-inside text-muted-foreground">{renderMarkdownList(analysisResult.weaknesses)}</ul>
                    </div>
                     <div>
                        <h4 className="font-bold text-primary mb-2 flex items-center gap-2"><Target /> Best Moves</h4>
                        <ul className="space-y-1 list-inside text-muted-foreground">{renderMarkdownList(analysisResult.bestMoves)}</ul>
                    </div>
                    <Separator/>
                     <div>
                        <h4 className="font-bold text-accent mb-1">Suggested Move: <span className='font-mono'>{analysisResult.suggestedMove}</span></h4>
                    </div>
                </div>
            )}
            {isLoading.suggestion && !suggestionResult && <p className="text-sm text-muted-foreground animate-pulse">Getting hint...</p>}
            {suggestionResult && (
                <div>
                    <h4 className="font-bold text-accent mb-2">Suggested Move: {suggestionResult.move}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{suggestionResult.reason}</p>
                </div>
            )}
            {!isLoading.analysis && !analysisResult && !isLoading.suggestion && !suggestionResult && (
                <p className="text-sm text-center text-muted-foreground pt-16">Use AI assistance to get hints or analysis of the position.</p>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default GameControls;
