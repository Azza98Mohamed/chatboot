import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
type MessageRole = 'user' | 'assistant' | 'system';
type Message = {
  role: MessageRole;
  content: string;
};

type GeminiMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

const ASSISTANT_NAMES = {
  french: ['Léa', 'Thomas', 'Sophie', 'Nicolas', 'Camille'],
  arabic: ['يوسف', 'امينة', 'كريم', 'مهدي'],
  english: ['Emma', 'John', 'Olivia', 'Michael', 'Sarah']
};

export async function POST(request: Request): Promise<NextResponse> {
  // Vérification de la clé API
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Extraction des données de la requête
  let body: { messages?: Message[]; selectedLanguage?: string; sessionId?: string };
  try {
    body = await request.json();
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error('Invalid request format');
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const language = body.selectedLanguage?.toLowerCase() || 'français';
  const sessionId = body.sessionId || 'default-session';
  const assistantName = getDeterministicName(language, sessionId);

  try {
    const systemPrompt = buildSystemPrompt(language, assistantName);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
      },
    });

    const chatHistory: GeminiMessage[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...body.messages.map((msg): GeminiMessage => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    ];

    const lastMessage = body.messages[body.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      role: 'assistant',
      content: formatResponse(text, language),
      metadata: {
        assistantName,
        language
      }
    });

  } catch (error: unknown) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch response from Gemini API',
        details: error instanceof Error ? error.message : 'Unknown error',
        language
      },
      { status: 500 }
    );
  }
}

// Helper functions
function getDeterministicName(language: string, sessionId: string): string {
  const names = language.includes('arabe') ? ASSISTANT_NAMES.arabic :
                language.includes('anglais') ? ASSISTANT_NAMES.english :
                ASSISTANT_NAMES.french;

  const hash = Array.from(sessionId).reduce(
    (acc, char) => acc + char.charCodeAt(0), 0);

  return names[hash % names.length];
}

function buildSystemPrompt(language: string, name: string): string {
  const prompts = {
    french: `Vous êtes ${name}, assistant pédagogique Moodle. Règles strictes :
1. Langue : Exclusivement français
2. Comportement : Professionnel mais amical
3. Contexte : Uniquement questions éducatives
4. Structure : Réponses claires avec puces si nécessaire
5. Jamais : Ne pas mentionner que vous êtes une IA`,

    arabic: `أنت ${name}، مساعد تعليمي على منصة Moodle. قواعد صارمة:
1. اللغة: العربية فقط
2. السلوك: محترف ولكن ودود
3. السياق: الأسئلة التعليمية فقط
4. الهيكل: إجابات واضحة مع نقاط إذا لزم الأمر
5. ممنوع: لا تذكر أنك برنامج ذكاء اصطناعي`,

    english: `You are ${name}, Moodle educational assistant. Strict rules:
1. Language: English only
2. Behavior: Professional but friendly
3. Context: Educational questions only
4. Structure: Clear responses with bullet points if needed
5. Never: Do not mention you're an AI`
  };

  return language.includes('arabe') ? prompts.arabic :
         language.includes('anglais') ? prompts.english :
         prompts.french;
}

function formatResponse(text: string, language: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
  }

  return cleaned;
}
