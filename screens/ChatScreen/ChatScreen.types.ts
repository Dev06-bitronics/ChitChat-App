// // Shared types for ChatScreen and related components/hooks
// export interface GroupChat {
//   _id: string;
//   name?: string;
//   members: User[];
//   createdBy: string;
//   createdAt: string;
//   avatar?: string;
//   isGroup: true;
//   lastMessage?: {
//     content: string;
//     senderId: string;
//     timestamp: string;
//   } | null;
// }

// export interface User {
//   _id: string;
//   id: string;
//   name: string;
//   avatar?: string;
//   email?: string;
//   online?: boolean;
//   description?: string;
//   isOnline?: boolean;
//   lastMessage?: {
//     content: string;
//     senderId: string;
//     timestamp: string;
//   } | null;
//   lastSeen?: string;
//   lastMessageSender?: string;
//   lastMessageTimestamp?: string;
//   unreadCount?: number;
// }

// export interface Message {
//   id: string;
//   _id: string;
//   senderId?: {
//     _id: string;
//     name?: string;
//   } | null; 
//   receiverId?: {
//     _id: string;
//     name?: string;
//   } | null;
//   isPinned?: boolean;
//   conversationId?: string;
//   content: string;
//   type: 'text' | 'image' | 'file' | 'emoji' | 'audio' | 'video';
//   timestamp?: string;
//   createdAt?: string;
//   updatedAt?: string;
//   deliveredAt?: string;
//   seenAt?: string;
//   fileUrl?: string;
//   fileName?: string;
//   fileType?: string;
//   fileSize?: number;
//   reactions?:  any;
//   [key: string]: any;
//   seen?: boolean;
//   clientId?: string;
//   status?: 'sent' | 'delivered' | 'seen';
// } 

// Shared types for ChatScreen and related components/hooks
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
  id?: string; // Alias for _id
  description?: string;
  isOnline?: boolean; // Alias for online
  unreadCount?: number;
  lastMessage?: string | { content: string; senderId: string; timestamp: string } | null;
  lastMessageTimestamp?: string;
  members?: any;
  isGroup?: boolean; // Indicates if this is a group chat
  timestamp?: string; // Last message timestamp
  participants?: string[]; // For group compatibility
  participantsStatus?: { [userId: string]: 'joined' | 'pending' }; // For group compatibility
  createdBy?: string; // For group compatibility
  createdAt?: string; // For group compatibility
}

export interface MessagePreview {
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: string;
  type?: 'text' | 'image' | 'file' | 'emoji' | 'audio' | 'video';
}

export interface Message {
  id: string; // Client-side ID
  _id: string; // Server-side ID
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiverId?: {
    _id: string;
    name?: string;
  };
  groupId?: string; // For group messages
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
  reactions?: Record<string, string>; // { userId: emoji }
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