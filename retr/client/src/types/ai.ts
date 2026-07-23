export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model?: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface Choice {
  index: number;
  message: Message;
  finish_reason?: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}