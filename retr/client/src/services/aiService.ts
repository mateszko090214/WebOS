import { ChatRequest, ChatResponse } from '../types/ai';

// In a real app, you might get this from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    // Assuming the response has at least one choice
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};