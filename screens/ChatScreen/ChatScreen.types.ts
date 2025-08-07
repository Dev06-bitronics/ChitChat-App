export interface BaseUser {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
  online?: boolean;
  lastSeen?: string;

}

export interface GroupMember extends BaseUser {
  role?: 'admin' | 'member';
  joinedAt?: string;
}

export interface GroupChat {
  _id: string;
  name: string;
  avatar?: string;
  participants: string[];
  participantsStatus?: { [userId: string]: 'joined' | 'pending' };
  createdBy: string;
  createdAt?: string;
  isGroup: true;
  lastMessage?: string | null;
  lastMessageTimestamp?: string;
  unreadCount?: number;
  members?: Array<{
    _id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  }>;
}

export type ChatParticipant = User | GroupChat;
export interface User extends BaseUser {
  id?: string;
  description?: string;
  isOnline?: boolean;
  unreadCount?: number;
  lastMessage?: string | { content: string; senderId: string; timestamp: string } | null;
  lastMessageTimestamp?: string;
  members?: any;
  isGroup?: boolean;
  timestamp?: string;
  participants?: string[];
  participantsStatus?: { [userId: string]: 'joined' | 'pending' };
  createdBy?: string;
  createdAt?: string;
}

export interface MessagePreview {
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: string;
  type?: 'text' | 'image' | 'file' | 'emoji' | 'audio' | 'video';
}

export interface Message {
  id: string;
  _id: string;
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiverId?: {
    _id: string;
    name?: string;
  };
  groupId?: string;
  isPinned?: boolean;
  conversationId?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'emoji' | 'audio' | 'video';
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
  deliveredAt?: string;
  seenAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  reactions?: Record<string, string>;
  replyToMessageId?: string;
  replyToMessage?: {
    content: string;
    senderId: string;
  };
  seen?: boolean;
  clientId?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';
  edited?: boolean;
  editHistory?: {
    content: string;
    editedAt: string;
  }[];
}