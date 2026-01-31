export interface DocumentSource {
  id: string;
  name: string;
  content: string;
  updatedAt: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  type?: 'text' | 'quiz' | 'podcast';
  data?: any;
}

export enum AppView {
  CHATS = 'chats',
  ADMIN = 'admin'
}