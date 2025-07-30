// Shared types for ChatScreen and related components/hooks
export interface User {
  _id: string;
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  online?: boolean;
  description?: string;
  isOnline?: boolean;
  lastMessage?: string;
  lastSeen?: string;
  lastMessageSender?: string;
  lastMessageTimestamp?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  _id: string;
  senderId: string;
  receiverId: string;
  conversationId?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'emoji' | 'audio' | 'video';
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  deliveredAt?: string;
  seenAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  reactions?:  string | null;
  [key: string]: any;
  seen?: boolean;
  clientId?: string;
  status?: 'sent' | 'delivered' | 'seen';
} 