import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  ChatbotSession,
  ChatMessage,
  ChatFeedback,
} from './entities/chatbot-session.entity';
import { RagService } from './rag.service';

const SYSTEM_PROMPT =
  'You are a Hebrew-speaking assistant for Likud party members. ' +
  'Answer questions about Likud history, current events, primaries, and party policy. ' +
  'Never give electoral advice or speak for other parties.';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private dictalmClient: OpenAI | null = null;
  private claudeClient: OpenAI | null = null;

  constructor(
    @InjectRepository(ChatbotSession)
    private readonly sessionRepository: Repository<ChatbotSession>,
    private readonly configService: ConfigService,
    private readonly ragService: RagService,
  ) {
    const dictalmUrl = this.configService.get<string>('DICTALM_API_URL');
    if (dictalmUrl) {
      this.dictalmClient = new OpenAI({
        baseURL: dictalmUrl,
        apiKey: 'not-needed',
      });
    }

    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.claudeClient = new OpenAI({
        baseURL: 'https://api.anthropic.com/v1/',
        apiKey: anthropicKey,
      });
    }
  }

  /**
   * Create a new chat session.
   */
  async createSession(
    appUserId?: string,
    deviceId?: string,
  ): Promise<ChatbotSession> {
    const session = this.sessionRepository.create({
      appUserId: appUserId || undefined,
      deviceId: deviceId || undefined,
      messages: [],
      messageCount: 0,
      flaggedForReview: false,
    } as Partial<ChatbotSession>);

    return this.sessionRepository.save(session) as Promise<ChatbotSession>;
  }

  /**
   * Get a session by ID.
   */
  async getSession(sessionId: string): Promise<ChatbotSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Send a message and get an assistant reply.
   */
  async chat(sessionId: string, userMessage: string): Promise<string> {
    const session = await this.getSession(sessionId);

    // Retrieve relevant context via RAG
    const chunks = await this.ragService.retrieveContext(userMessage);
    const contextPrompt = this.ragService.buildContextPrompt(chunks);

    // Add user message to session
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(userMsg);

    // Build messages for LLM
    const systemContent = contextPrompt
      ? `${SYSTEM_PROMPT}\n\n${contextPrompt}`
      : SYSTEM_PROMPT;

    const llmMessages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [
      { role: 'system', content: systemContent },
      ...session.messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Call LLM (DictaLM primary, Claude fallback)
    let assistantReply: string;
    try {
      assistantReply = await this.callDictaLM(llmMessages);
    } catch (error) {
      this.logger.warn(
        `DictaLM failed, falling back to Claude: ${error.message}`,
      );
      try {
        assistantReply = await this.callClaude(llmMessages);
      } catch (claudeError) {
        this.logger.error(`Claude fallback also failed: ${claudeError.message}`);
        assistantReply =
          'מצטער, לא הצלחתי לעבד את הבקשה כרגע. אנא נסה שוב מאוחר יותר.';
      }
    }

    // Add assistant reply to session
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: assistantReply,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(assistantMsg);
    session.messageCount += 1;

    await this.sessionRepository.save(session);

    return assistantReply;
  }

  /**
   * Flag a session for admin review.
   */
  async flagSession(sessionId: string): Promise<ChatbotSession> {
    const session = await this.getSession(sessionId);
    session.flaggedForReview = true;
    return this.sessionRepository.save(session);
  }

  /**
   * Provide feedback on a session.
   */
  async provideFeedback(
    sessionId: string,
    feedback: ChatFeedback,
  ): Promise<ChatbotSession> {
    const session = await this.getSession(sessionId);
    session.feedback = feedback;
    return this.sessionRepository.save(session);
  }

  /**
   * Call DictaLM 3.0 via OpenAI-compatible vLLM endpoint.
   */
  private async callDictaLM(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    if (!this.dictalmClient) {
      throw new Error('DictaLM client not configured');
    }

    const response = await this.dictalmClient.chat.completions.create({
      model: 'dictalm-3.0',
      messages: messages as any,
      max_tokens: 1024,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Call Claude API as fallback.
   */
  private async callClaude(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    if (!this.claudeClient) {
      throw new Error('Claude client not configured');
    }

    const response = await this.claudeClient.chat.completions.create({
      model: 'claude-sonnet-4-20250514',
      messages: messages as any,
      max_tokens: 1024,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  }
}
