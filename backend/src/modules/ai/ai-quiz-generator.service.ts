import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Article } from '../articles/entities/article.entity';

export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_PROMPT =
  'Generate 5 Hebrew multiple-choice questions (4 options each) based on these news articles. ' +
  'Respond in JSON format: [{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "..."}]';

const EVERGREEN_QUESTIONS: GeneratedQuizQuestion[] = [
  {
    question: 'מי היה ראש הממשלה הראשון מתנועת הליכוד?',
    options: ['מנחם בגין', 'יצחק שמיר', 'אריאל שרון', 'בנימין נתניהו'],
    correctIndex: 0,
    explanation: 'מנחם בגין היה ראש הממשלה הראשון מתנועת הליכוד, כיהן מ-1977 עד 1983.',
  },
  {
    question: 'באיזו שנה הוקמה תנועת הליכוד?',
    options: ['1970', '1973', '1977', '1965'],
    correctIndex: 1,
    explanation: 'תנועת הליכוד הוקמה בשנת 1973 כאיחוד של מספר מפלגות ימין.',
  },
  {
    question: 'מה שם המטה המרכזי של הליכוד בתל אביב?',
    options: ['בית ז\'בוטינסקי', 'מצודת זאב', 'בית הליכוד', 'מרכז בגין'],
    correctIndex: 1,
    explanation: 'מצודת זאב היא המטה המרכזי של תנועת הליכוד ברחוב קינג ג\'ורג\' בתל אביב.',
  },
  {
    question: 'מי מבין הבאים לא כיהן כיו"ר הליכוד?',
    options: ['אריאל שרון', 'אהוד אולמרט', 'שמעון פרס', 'בנימין נתניהו'],
    correctIndex: 2,
    explanation: 'שמעון פרס היה יו"ר מפלגת העבודה ולא של הליכוד.',
  },
  {
    question: 'באיזה הסכם שלום חתם מנחם בגין?',
    options: ['הסכמי אוסלו', 'הסכם קמפ דייוויד', 'הסכם וואדי ערבה', 'הסכם השלום עם לבנון'],
    correctIndex: 1,
    explanation: 'מנחם בגין חתם על הסכם קמפ דייוויד עם מצרים ב-1978.',
  },
];

@Injectable()
export class AiQuizGeneratorService {
  private readonly logger = new Logger(AiQuizGeneratorService.name);
  private claudeClient: OpenAI | null = null;

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly configService: ConfigService,
  ) {
    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.claudeClient = new OpenAI({
        baseURL: 'https://api.anthropic.com/v1/',
        apiKey: anthropicKey,
      });
    }
  }

  /**
   * Generate a daily quiz based on articles from the last 24 hours.
   */
  async generateDailyQuiz(): Promise<GeneratedQuizQuestion[]> {
    const since = new Date();
    since.setHours(since.getHours() - 24);

    const articles = await this.articleRepository.find({
      where: {
        status: 'published' as any,
        publishedAt: MoreThan(since),
      },
      order: { publishedAt: 'DESC' },
      take: 10,
    });

    if (articles.length === 0) {
      this.logger.warn(
        'No recent articles found for quiz generation, using evergreen questions',
      );
      return this.getEvergreenQuestions(5);
    }

    const articlesText = articles
      .map((a) => `כותרת: ${a.title}\nתוכן: ${a.content.slice(0, 500)}`)
      .join('\n\n---\n\n');

    if (!this.claudeClient) {
      this.logger.warn('Claude client not configured, using evergreen questions');
      return this.getEvergreenQuestions(5);
    }

    try {
      const response = await this.claudeClient.chat.completions.create({
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: QUIZ_PROMPT },
          { role: 'user', content: articlesText },
        ],
        max_tokens: 2048,
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content || '[]';
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Quiz generation failed: ${error.message}`);
      return this.getEvergreenQuestions(5);
    }
  }

  /**
   * Get evergreen fallback questions.
   */
  getEvergreenQuestions(count: number): GeneratedQuizQuestion[] {
    return EVERGREEN_QUESTIONS.slice(0, count);
  }
}
