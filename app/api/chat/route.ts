import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialisez le client Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ''); // Utilisez une variable d'environnement pour la clé API

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
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
    // Initialisez le modèle Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Structurez les messages pour Gemini
    const chatHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] }, // Ajoutez le prompt système
      ...messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user', // Gemini utilise 'model' au lieu de 'assistant'
        parts: [{ text: msg.content }],
      })),
    ];

    // Envoyez la requête à Gemini
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content); // Envoyez le dernier message de l'utilisateur
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      response: text,
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error);

    return NextResponse.json(
      { error: 'Failed to fetch response from Gemini API' },
      { status: 500 }
    );
  }
}