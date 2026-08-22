import { FunctionDeclaration } from '@google/generative-ai';

export interface ToolExecutionContext {
  userId?: number;
}

export interface GeminiTool {
  name: string;
  declaration: FunctionDeclaration;
  execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>>;
}
