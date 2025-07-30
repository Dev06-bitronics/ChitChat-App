
import { useEffect } from 'react';
import { Message, User } from './ChatScreen.types';

export function useChatSocketHandlers({
  socket,
  myUserId,
  selectedUser,
  setMessages,
  setUsers,
  setUnreadCounts,
  setTypingUsers,
  messages,
  users, 
}: {
  socket: any;
  myUserId: string;
  selectedUser: User | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setUnreadCounts: React.Dispatch<React.SetStateAction<{ [userId: string]: number }>>;
  setTypingUsers: React.Dispatch<React.SetStateAction<{ [userId: string]: boolean }>>;
  messages: Message[];
  users: User[]; 
}) {
  // Connection events
  useEffect(() => {
  if (!socket) return;
  
  const handleConnect = () => {
    console.log('✅ Connected:', socket.id);
    // Remove timeout and emit immediately
    socket.emit('join_room', myUserId);
  };

  const handleConnectError = (err: any) => {
    console.error('❌ Connection Error:', err.message);
    // Attempt to reconnect on error
    socket.connect();
  };

  if (socket.connected) {
    // If already connected, join room immediately
    socket.emit('join_room', myUserId);
  }

  socket.on('connect', handleConnect);
  socket.on('connect_error', handleConnectError);

  return () => {
    socket.off('connect', handleConnect);
    socket.off('connect_error', handleConnectError);
  };
}, [socket, myUserId]);

  // Incoming messages
  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (data: any) => {
      console.log(data, "receivemessage-------------->");
      if (
        selectedUser &&
        (
          (data.senderId === selectedUser.id && data.receiverId === myUserId) ||
          (data.senderId === myUserId && data.receiverId === selectedUser.id)
        )
      ) {
        setMessages((prev: Message[]) => {
          const exists = prev.some(m => m.id === data.id);
          return exists ? prev : [...prev, data];
        });
      } else if (data.receiverId === myUserId) {
        setUnreadCounts(prev => ({
          ...prev,
          [data.senderId]: (prev[data.senderId] ?? (users.find(u => u.id === data.senderId)?.unreadCount ?? 0)) + 1
        }));
      }
      socket.emit('message_delivered', {
        messageId: data.id || data.messageId,
        receiverId: data.receiverId,
      });
    };
    socket.on('receive_message', handleReceiveMessage);
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, selectedUser, myUserId, setMessages, setUnreadCounts, users]);

  // Delivery/seen events
  useEffect(() => {
    if (!socket) return;
    const handleMessageDelivered = (data: { messageId: string }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
      ));
    };
    const handleMessageSeen = (data: { messageId: string }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, status: 'seen' } : msg
      ));
    };
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_seen', handleMessageSeen);
    return () => {
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_seen', handleMessageSeen);
    };
  }, [socket, setMessages]);

  // Reaction updates (add/remove)
  useEffect(() => {
    if (!socket) return;
    const handleMessageReacted = (updatedMessage: any) => {
      // Convert array to object: { [userId]: reaction }
      const reactionsObj = Array.isArray(updatedMessage.reactions)
        ? Object.fromEntries((updatedMessage.reactions as Array<{ userId: string; reaction: string }>).
          map((r: { userId: string; reaction: string }) => [r.userId, r.reaction]))
        : updatedMessage.reactions;
      setMessages(prevMsgs => prevMsgs.map(msg =>
        msg.id === updatedMessage.messageId ? { ...msg, reactions: reactionsObj } : msg
      ));
    };
    socket.on('message_reacted', handleMessageReacted);
    return () => {
      socket.off('message_reacted', handleMessageReacted);
    };
  }, [socket, setMessages]);

  // Mark messages as seen when chat is opened or messages change
  useEffect(() => {
    if (!socket || !selectedUser) return;
    // Find all messages from the selected user that are not yet seen
    const unseenMessages = messages.filter(
      msg => msg.senderId === selectedUser.id && msg.status !== 'seen'
    );
    unseenMessages.forEach(msg => {
      socket.emit('mark_as_seen', { messageId: msg.id });
    });
    // Also emit to reset unread count when chat is opened
    socket.emit('reset_unread_count', { userId: selectedUser.id });
  }, [socket, selectedUser, messages]);

  // Typing indicator
  useEffect(() => {
    if (!socket) return;
    const handleUserTyping = ({ from, isTyping }: { from: string, isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return { ...prev, [from]: true };
        } else {
          const updated = { ...prev };
          delete updated[from];
          return updated;
        }
      });
    };
    socket.on('user_typing', handleUserTyping);
    return () => {
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, setTypingUsers]);

  // Online/offline status
  useEffect(() => {
    if (!socket) return;
    const handleGetOnlineUsers = (onlineUsers: Array<{ userId: string, isOnline: boolean, lastSeen: string | null }>) => {
      setUsers(prevUsers => prevUsers.map(user => {
        const found = onlineUsers.find(u => u.userId === user.id);
        if (found) {
          return { ...user, isOnline: found.isOnline, online: found.isOnline, lastSeen: found.lastSeen || undefined };
        }
        return { ...user, isOnline: false };
      }));
    };
    const handleUserOnline = ({ userId, lastSeen }: { userId: string, lastSeen: string | null }) => {
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === userId ? { ...user, online: true, isOnline: true, lastSeen: lastSeen || undefined } : user
      ));
    };
    const handleUserOffline = ({ userId, lastSeen }: { userId: string, lastSeen: string | null }) => {
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === userId ? { ...user, online: false, isOnline: false, lastSeen: lastSeen || undefined } : user
      ));
    };
    socket.on('getOnlineUsers', handleGetOnlineUsers);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    return () => {
      socket.off('getOnlineUsers', handleGetOnlineUsers);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
    };
  }, [socket, setUsers]);

  // Real-time last message update for ChatCard
  useEffect(() => {
    if (!socket) return;

    const handleLastMessageUpdate = (payload: { conversationId: string; lastMessage: any; participants: string[] }) => {
      console.log(payload, "payload-------------->");

      const otherUserId = payload.participants.find(p => p !== myUserId); 
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === otherUserId
            ? {
              ...user,
              lastMessage: payload.lastMessage?.content || '',
              lastMessageSender: payload.lastMessage?.senderId,
              lastMessageTimestamp: payload.lastMessage?.timestamp
            }
            : user
        )
      );
    };

    socket.on('last_message_updated', handleLastMessageUpdate);
    return () => socket.off('last_message_updated', handleLastMessageUpdate);
  }, [socket, setUsers, myUserId]);

  // Listen for unread_count_update from backend to update unreadCounts dynamically
  useEffect(() => {
    if (!socket) return;

    const handleUnreadCountUpdate = (data: { userId: string; unreadCount: number }) => {
      setUnreadCounts(prev => ({
        ...prev,
        [data.userId]: data.unreadCount,
      }));
    };

    socket.on('unread_count_update', handleUnreadCountUpdate);
    return () => {
      socket.off('unread_count_update', handleUnreadCountUpdate);
    };
  }, [socket, setUnreadCounts]);

  // Listen for message_deleted event from backend
  useEffect(() => {
    if (!socket) return;

    const handleMessageDeleted = (data: { messageId: string }) => {
      console.log('Received message_deleted event:', data);
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== data.messageId);
        console.log('Messages after deletion:', filtered.length);
        return filtered;
      });
    };

    socket.on('message_deleted', handleMessageDeleted);
    return () => {
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, setMessages]);

  // Listen for last_message_updated event from backend
  useEffect(() => {
    if (!socket) return;

    const handleLastMessageUpdated = (data: { 
      userId: string; 
      lastMessage?: string; 
      lastMessageSender?: string; 
      lastMessageTimestamp?: string;
    }) => {
      setUsers(prev => prev.map(user => 
        user.id === data.userId 
          ? {
              ...user,
              lastMessage: data.lastMessage || '',
              lastMessageSender: data.lastMessageSender,
              lastMessageTimestamp: data.lastMessageTimestamp,
            }
          : user
      ));
    };

    socket.on('last_message_updated', handleLastMessageUpdated);
    return () => {
      socket.off('last_message_updated', handleLastMessageUpdated);
    };
  }, [socket, setUsers]);

  // Listen for message_edited event from backend
  useEffect(() => {
    if (!socket) return;
    const handleMessageEdited = (updatedMessage: any) => {
      setMessages(prevMsgs => prevMsgs.map(msg =>
        (msg._id === updatedMessage._id) ? { ...msg, content: updatedMessage.content || updatedMessage.newContent, edited: true } : msg
      ));
    };
    socket.on('message_edited', handleMessageEdited);
    return () => {
      socket.off('message_edited', handleMessageEdited);
    };
  }, [socket, setMessages]);
}
