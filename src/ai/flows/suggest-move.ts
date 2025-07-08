'use server';

/**
 * @fileOverview Suggests a chess move to the user.
 *
 * - suggestMove - A function that suggests a chess move.
 * - SuggestMoveInput - The input type for the suggestMove function.
 * - SuggestMoveOutput - The return type for the suggestMove function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMoveInputSchema = z.object({
  boardState: z.string().describe('A string representation of the chess board state in FEN notation.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level for the move suggestion.'),
});
export type SuggestMoveInput = z.infer<typeof SuggestMoveInputSchema>;

const SuggestMoveOutputSchema = z.object({
  move: z.string().describe('The suggested move in algebraic notation (e.g., e4, Nf3, Rd8).'),
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
  prompt: `You are an expert chess player and strategist. Given the current state of the chess board and the desired difficulty level, you will suggest the best move for the current player.

Board State (FEN Notation): {{{boardState}}}
Difficulty: {{{difficulty}}}

Consider the difficulty level when suggesting the move. A higher difficulty should result in a more strategic and complex move.

Output the move in algebraic notation (e.g., e4, Nf3, Rd8) and provide a brief explanation of your reasoning behind the move.

Move: {{move}}
Reason: {{reason}}`,
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
