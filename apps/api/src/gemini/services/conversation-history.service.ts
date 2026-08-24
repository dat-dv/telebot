import { Injectable, Logger } from '@nestjs/common';
import { Content } from '@google/generative-ai';

export interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserConversationSession {
  messages: ConversationMessage[];
  lastActivityAt: number;
}

@Injectable()
export class ConversationHistoryService {
  private readonly logger = new Logger(ConversationHistoryService.name);
  private readonly sessions = new Map<number, UserConversationSession>();

  /**
   * Maximum messages preserved per user session (Sliding window).
   * 8 messages = 4 user/model conversation turns.
   */
  private readonly maxMessages: number = 8;

  /**
   * Time to live in milliseconds before context automatically expires.
   * Default: 10 minutes.
   */
  private readonly ttlMs: number = 10 * 60 * 1000;

  constructor() {
    // Schedule periodic cleanup every 5 minutes
    const interval = setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
    if (typeof interval.unref === 'function') {
      interval.unref();
    }
  }

  public getHistory(userId: number): Content[] {
    const session = this.sessions.get(userId);
    if (!session) return [];

    const now = Date.now();
    if (now - session.lastActivityAt > this.ttlMs) {
      this.sessions.delete(userId);
      return [];
    }

    return session.messages
      .filter((msg) => msg.text.trim().length > 0)
      .map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));
  }

  public appendUserMessage(userId: number, text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.addMessage(userId, 'user', trimmed);
  }

  public appendModelMessage(userId: number, text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.addMessage(userId, 'model', trimmed);
  }

  public clearHistory(userId: number): void {
    this.sessions.delete(userId);
  }

  private addMessage(userId: number, role: 'user' | 'model', text: string): void {
    const now = Date.now();
    let session = this.sessions.get(userId);

    if (!session || now - session.lastActivityAt > this.ttlMs) {
      session = {
        messages: [],
        lastActivityAt: now,
      };
      this.sessions.set(userId, session);
    }

    session.messages.push({
      role,
      text,
      timestamp: now,
    });

    session.lastActivityAt = now;

    // Maintain sliding window buffer
    if (session.messages.length > this.maxMessages) {
      session.messages = session.messages.slice(-this.maxMessages);
    }
  }

  public cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.lastActivityAt > this.ttlMs) {
        this.sessions.delete(userId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired conversation sessions.`);
    }
  }
}
