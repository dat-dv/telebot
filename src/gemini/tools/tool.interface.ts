import { FunctionDeclaration } from '@google/generative-ai';

export interface GeminiTool {
  name: string;
  declaration: FunctionDeclaration;
  execute(args: Record<string, unknown>): Promise<Record<string, unknown>>;
}
