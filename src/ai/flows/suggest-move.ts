'use server';

/**
 * @fileOverview Suggests a chess move to the user based on a power level.
 *
 * - suggestMove - A function that suggests a chess move.
 * - SuggestMoveInput - The input type for the suggestMove function.
 * - SuggestMoveOutput - The return type for the suggestMove function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMoveInputSchema = z.object({
  boardState: z.string().describe('A string representation of the chess board state in FEN notation.'),
  powerLevel: z.number().min(0).max(100).describe('The AI power level, from 0 (Beginner) to 100 (Unbeatable).'),
});
export type SuggestMoveInput = z.infer<typeof SuggestMoveInputSchema>;

const SuggestMoveOutputSchema = z.object({
  move: z.string().describe('The suggested move in long algebraic notation (e.g., e2e4, e7e8q for promotion).'),
  reason: z.string().describe('The reasoning behind the suggested move.'),
});
export type SuggestMoveOutput = z.infer<typeof SuggestMoveOutputSchema>;

export async function suggestMove(input: SuggestMoveInput): Promise<SuggestMoveOutput> {
  return suggestMoveFlow(input);
}

const suggestMovePrompt = ai.definePrompt({
  name: 'suggestMovePrompt',
  input: {schema: SuggestMoveInputSchema},
  output: {schema: SuggestMoveOutputSchema},
  prompt: `You are an expert chess engine with a configurable power level. Given the current state of the chess board and the desired power level, you will suggest the best move for the current player.

Board State (FEN Notation): {{{boardState}}}
Power Level: {{{powerLevel}}}/100

Use the power level to determine the quality of your move. A higher power level should result in a more strategic, optimal, and complex move. A lower power level should result in more blunders or less optimal moves.

Power Level Guide:
- 0-10: Beginner. Makes very basic, often random or poor moves.
- 11-20: Casual. Makes some mistakes and misses simple tactics.
- 21-30: Intermediate. Plays logically but can be out-maneuvered.
- 31-40: Good Player. Understands basic strategy and calculates some traps.
- 41-50: Advanced Human. Plays solid, consistent chess.
- 51-80: Strong Engine. Highly tactical and strategic. Very difficult to beat.
- 81-99: Brutal Engine. Pro-level play, calculating deep variations.
- 100: Full Power AI. Near-perfect, almost unbeatable play.

Output the move in long algebraic notation (e.g., e2e4 for a standard move, e7e8q for a promotion) and provide a brief explanation of your reasoning behind the move.`,
});

const suggestMoveFlow = ai.defineFlow(
  {
    name: 'suggestMoveFlow',
    inputSchema: SuggestMoveInputSchema,
    outputSchema: SuggestMoveOutputSchema,
  },
  async input => {
    const {output} = await suggestMovePrompt(input);
    return output!;
  }
);
