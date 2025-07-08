// 'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a chess board position and providing insights.
 *
 * - analyzePosition - A function that takes a FEN representation of a chess board and returns an analysis of the position.
 * - AnalyzePositionInput - The input type for the analyzePosition function.
 * - AnalyzePositionOutput - The return type for the analyzePosition function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePositionInputSchema = z.object({
  fen: z.string().describe('A FEN string representing the chess board position to analyze.'),
});
export type AnalyzePositionInput = z.infer<typeof AnalyzePositionInputSchema>;

const AnalyzePositionOutputSchema = z.object({
  analysis: z.string().describe('A detailed analysis of the chess board position, including strengths, weaknesses, and recommended moves.'),
});
export type AnalyzePositionOutput = z.infer<typeof AnalyzePositionOutputSchema>;

export async function analyzePosition(input: AnalyzePositionInput): Promise<AnalyzePositionOutput> {
  return analyzePositionFlow(input);
}

const analyzePositionPrompt = ai.definePrompt({
  name: 'analyzePositionPrompt',
  input: {schema: AnalyzePositionInputSchema},
  output: {schema: AnalyzePositionOutputSchema},
  prompt: `You are a grandmaster chess player. Analyze the following chess board position and provide insights into the strengths and weaknesses of the position, as well as potential next moves. Provide a detailed explanation.

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
