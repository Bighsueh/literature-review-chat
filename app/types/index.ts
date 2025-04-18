export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags: string[];
}

export interface PDF {
  id: string;
  name: string;
  size: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'system' | 'owl';
  text: string;
  timestamp: Date;
  suggestions?: Note[];
  isRead?: boolean;
} 