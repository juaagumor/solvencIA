
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

export interface ConceptMap {
  core: string;
  branches: { node: string; details: string[] }[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  type?: 'text' | 'quiz' | 'mindmap' | 'podcast';
  data?: any;
}

export enum AppView {
  CHATS = 'chats',
  ADMIN = 'admin'
}
