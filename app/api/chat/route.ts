import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Définissez les types pour les messages
type MessageRole = 'user' | 'assistant' | 'system';
type Message = {
  role: MessageRole;
  content: string;
};

type GeminiMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

// Initialisation du client Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request): Promise<NextResponse> {
  // Validation du corps de la requête
  let body: { messages?: Message[] };
  try {
    body = await request.json();
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error('Invalid request format');
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const messages = body.messages;

  const systemPrompt = `You are an AI learning assistant simulating a Moodle-like educational chatbot. 
    Provide helpful, concise, and educational responses. 
    Focus on:
    - Answering study-related questions
    - Explaining academic concepts
    - Providing learning guidance
    - Maintaining a professional and supportive tone
  `;

  try {
    // Initialisation du modèle Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Conversion des messages pour Gemini avec typage strict
    const chatHistory: GeminiMessage[] = [
      { 
        role: 'user', 
        parts: [{ text: systemPrompt }] 
      },
      ...messages.map((msg: Message): GeminiMessage => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    ];

    // Validation du dernier message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // Envoi de la requête à Gemini
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      role: 'assistant',
      content: text,
    });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch response from Gemini API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}