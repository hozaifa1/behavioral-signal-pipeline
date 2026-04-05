import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export interface SegmentResult {
  intent: 'browsing' | 'high_intent' | 'ready_to_buy';
  confidence: number;
  recommended_channel: 'email' | 'sms' | 'whatsapp';
  personalized_message: string;
}

@Injectable()
export class SegmentService {
  private readonly logger = new Logger(SegmentService.name);
  private prisma: PrismaClient;
  private openai: any = null;

  constructor() {
    this.prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    this.initOpenAI();
  }

  private async initOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'sk-proj-your-key-here' && apiKey.length > 10) {
      try {
        const { default: OpenAI } = await import('openai');
        this.openai = new OpenAI({ apiKey });
        this.logger.log('OpenAI client initialized — LLM segmentation enabled');
      } catch {
        this.logger.warn('OpenAI package not installed — using rule-based segmentation');
      }
    } else {
      this.logger.log('No OPENAI_API_KEY set — using rule-based segmentation');
    }
  }

  async segment(userId: string): Promise<SegmentResult | { error: string; raw?: string }> {
    const userProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      return { error: 'User not found' };
    }

    if (this.openai) {
      return this.segmentWithLLM(userProfile);
    }
    return this.segmentWithRules(userProfile);
  }

  private async segmentWithLLM(userProfile: any): Promise<SegmentResult | { error: string; raw?: string }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: `You are a behavioral analyst. Given a user's behavioral data, output ONLY a valid JSON object. No markdown, no backticks, no explanation. Just the JSON.
Output format: { "intent": "browsing" | "high_intent" | "ready_to_buy", "confidence": 0.0-1.0, "recommended_channel": "email" | "sms" | "whatsapp", "personalized_message": string (max 100 chars) }`,
          },
          {
            role: 'user',
            content: JSON.stringify(userProfile),
          },
        ],
      });

      const text = response.choices[0].message.content || '{}';

      try {
        return JSON.parse(text) as SegmentResult;
      } catch {
        return { error: 'LLM returned invalid JSON', raw: text };
      }
    } catch (err: any) {
      this.logger.error('OpenAI API call failed, falling back to rules', err.message);
      return this.segmentWithRules(userProfile);
    }
  }

  private segmentWithRules(userProfile: any): SegmentResult {
    const { sessions, avgScroll } = userProfile;

    let intent: SegmentResult['intent'];
    let confidence: number;
    let recommended_channel: SegmentResult['recommended_channel'];
    let personalized_message: string;

    if (sessions >= 10 && avgScroll >= 70) {
      intent = 'ready_to_buy';
      confidence = 0.9;
      recommended_channel = 'whatsapp';
      personalized_message = `You've visited ${sessions} times — ready to check out? Here's a special offer!`;
    } else if (sessions >= 4 || avgScroll >= 50) {
      intent = 'high_intent';
      confidence = 0.7;
      recommended_channel = 'sms';
      personalized_message = `We noticed your interest! Come back and explore our latest picks.`;
    } else {
      intent = 'browsing';
      confidence = 0.5;
      recommended_channel = 'email';
      personalized_message = `Welcome! Check out our trending products curated just for you.`;
    }

    return { intent, confidence, recommended_channel, personalized_message };
  }
}
