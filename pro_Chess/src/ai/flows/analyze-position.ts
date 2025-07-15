'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a chess board position and providing insights.
 *
 * - analyzePosition - A function that takes a FEN representation of a chess board and returns an analysis of the position.
 * - AnalyzePositionInput - The input type for the analyzePosition function.
 * - AnalyzePositionOutput - The return type for the analyzePosition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePositionInputSchema = z.object({
  fen: z.string().describe('A FEN string representing the chess board position to analyze.'),
});
export type AnalyzePositionInput = z.infer<typeof AnalyzePositionInputSchema>;

const AnalyzePositionOutputSchema = z.object({
  strengths: z.string().describe('A markdown list of strengths for the current player.'),
  weaknesses: z.string().describe('A markdown list of weaknesses for the current player.'),
  bestMoves: z.string().describe('A markdown list of the best possible moves with brief explanations.'),
  suggestedMove: z.string().describe('The single best suggested move in algebraic notation (e.g., e4).'),
});
export type AnalyzePositionOutput = z.infer<typeof AnalyzePositionOutputSchema>;

export async function analyzePosition(input: AnalyzePositionInput): Promise<AnalyzePositionOutput> {
  return analyzePositionFlow(input);
}

const analyzePositionPrompt = ai.definePrompt({
  name: 'analyzePositionPrompt',
  input: {schema: AnalyzePositionInputSchema},
  output: {schema: AnalyzePositionOutputSchema},
  prompt: `You are a grandmaster chess player. Analyze the following chess board position (given in FEN notation) for the current player to move.

Provide the analysis in the following structured format:
- Strengths: A bulleted list of advantages for the current player.
- Weaknesses: A bulleted list of disadvantages or threats for the current player.
- Best Moves: A bulleted list of the top 2-3 recommended moves, with a brief explanation for each (e.g., "* e4 → Center control, opens bishop & queen").
- Suggested Move: The single best move you recommend, in standard algebraic notation (e.g., "e4").

Chess Position (FEN): {{{fen}}}`,
});

const analyzePositionFlow = ai.defineFlow(
  {
    name: 'analyzePositionFlow',
    inputSchema: AnalyzePositionInputSchema,
    outputSchema: AnalyzePositionOutputSchema,
  },
  async input => {
    const {output} = await analyzePositionPrompt(input);
    return output!;
  }
);
