import React, { useRef, useState, useEffect } from 'react';
import { FaBars, FaPlus, FaSmile, FaArrowDown, FaSearch } from 'react-icons/fa';
import { MdOutlineEdit } from "react-icons/md";
import { HiOutlineUserGroup } from "react-icons/hi";
import { MdOutlineDarkMode, MdPersonOutline, MdOutlineKeyboardArrowDown } from "react-icons/md";
//@ts-ignore
import styles from './ChatScreen.module.css';
import { useForm } from 'react-hook-form';
import FloatingMenuModal, { FloatingMenuOption } from '@/components/FloatingMenuModal/FloatingMenuModal';
import { ThemeProvider, useTheme } from '@/theme/themeContext';
import { useDispatch, useSelector } from 'react-redux';
import { getLastSeenStatus } from '@/utils/helperFunctions';
import { ToastContainer, toast } from 'react-toastify';
import { ALL_USERS, USER_LOGOUT, CHAT_CONVERSATION } from '@/api/api';
import ImageModal from '@/components/ImageModal/ImageModal';
import SettingsModal from '@/components/SettingsModal/SettingsModal';
import { useSocketContext } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatSidebar from './ChatSidebar';
import { useChatSocketHandlers } from './useChatSocketHandlers';
import { Message, User } from './ChatScreen.types';
import ChatHeader from './ChatHeader';



const ChatScreen: React.FC = () => {
  const dispatch = useDispatch();
  const myUserId = useSelector((state: any) => state.user.id);
  const token = useSelector((state: any) => state.user.token);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState({ name: 'You', avatar: '/logo.png', description: 'Available' });
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [menuHover, setMenuHover] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [imageModal, setImageModal] = useState<{ open: boolean; url: string; name?: string }>({ open: false, url: '', name: '' });
  const [conversationId, setConversationId] = useState<string | null>(null);
  const userName = useSelector((state: any) => state.user.name) || profile.name;
  const [emojiBarOpenId, setEmojiBarOpenId] = useState<string | null>(null);
  const emojiBarRefs = useRef<{ [id: string]: HTMLButtonElement | null }>({});
  const [openYouTubePlayers, setOpenYouTubePlayers] = useState<{ [msgId: string]: boolean }>({});
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: boolean }>({});
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [reactionRemoveOpenId, setReactionRemoveOpenId] = useState<string | null>(null);
  const { socket } = useSocketContext();
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { mode, toggleTheme } = useTheme();
  const { logout } = useAuth();



  const objectUrlsRef = useRef<string[]>([]);

  // react-hook-form for profile edit
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    setValue: setProfileValue,
    reset: resetProfile,
  } = useForm({
    defaultValues: {
      name: profile.name,
      description: profile.description,
    },
  });

  // Sync form with profile state when modal opens
  useEffect(() => {
    if (showSettings) {
      resetProfile({ name: profile.name, description: profile.description });
    }
  }, [showSettings]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    fetchUsers();
  }, []);



  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const updated = users.find(u => u.id === selectedUser.id);
    if (updated && (updated.isOnline !== selectedUser.isOnline || updated.online !== selectedUser.online)) {
      setSelectedUser(updated);
    }
  }, [users, selectedUser]);

  // Utility: Mark all messages from the other user as seen when chat is opened or messages change
  useEffect(() => {
    if (!socket || !selectedUser) return;
    // Find all messages from the selected user that are not yet seen
    const unseenMessages = messages.filter(
      msg => msg.senderId === selectedUser.id && msg.status !== 'seen'
    );
    unseenMessages.forEach(msg => {
      socket.emit('mark_as_seen', { messageId: msg.id, receiverId: selectedUser.id });
    });
    // No return value (no cleanup needed)
  }, [socket, selectedUser, messages]);

  // Remove the useEffect that listens for 'unread_count_update' in ChatScreen
  // It is now handled in useChatSocketHandlers

  const handleScroll = () => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    const scrollDistance = scrollHeight - scrollTop - clientHeight;
    setShowScrollToBottom(scrollDistance > 100);
    setIsAtBottom(scrollDistance < 50);
  };

  useEffect(() => {
    const ref = chatBodyRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
      handleScroll();
    }
    return () => { if (ref) ref.removeEventListener('scroll', handleScroll); };
  }, []);

  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevMessagesLength.current && isAtBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isAtBottom]);

  // Always scroll to bottom when switching chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUser]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const onProfileSave = (data: any) => {
    setProfile((prev) => ({ ...prev, name: data.name, description: data.description }));
    setShowSettings(false);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await ALL_USERS();
      if (response && response.status === 200) {
        const fetchedUsers = response.data?.data?.map((user: any) => ({
          ...user,
          online: Math.random() > 0.5,
          lastMessage: typeof user.lastMessage === 'object'
            ? user.lastMessage?.content || ''
            : user.lastMessage || '',
          lastMessageSender: typeof user.lastMessage === 'object'
            ? user.lastMessage?.senderId
            : undefined,
          lastMessageTimestamp: typeof user.lastMessage === 'object'
            ? user.lastMessage?.timestamp
            : undefined,
        }));
        setUsers(fetchedUsers);
        if (fetchedUsers.length > 0 && !selectedUser) {
          setSelectedUser(fetchedUsers[0]);
          try {
            const chatRes = await CHAT_CONVERSATION(fetchedUsers[0].id);
            if (chatRes && chatRes.status === 200) {
              setMessages(chatRes.data?.messages || []);
            } else {
              setMessages([]);
            }
          } catch {
            setMessages([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Use only the cleaned-up useEffect for 'connect' and optionally 'connect_error':
  // --- SOCKET LOGIC MOVED TO useChatSocketHandlers ---
  // useEffect(() => {
  //   if (!socket) return;
  //   const handleConnect = () => {
  //     console.log('✅ Connected:', socket.id);
  //     setTimeout(() => {
  //       socket.emit('join_room', myUserId);
  //     }, 500);
  //   };
  //   const handleConnectError = (err: any) => {
  //     console.error('❌ Connection Error:', err.message);
  //   };
  //   socket.on('connect', handleConnect);
  //   socket.on('connect_error', handleConnectError);
  //   return () => {
  //     socket.off('connect', handleConnect);
  //     socket.off('connect_error', handleConnectError);
  //   };
  // }, [socket, myUserId]);

  // useEffect(() => {
  //   if (!socket) return;
  //   const handleReceiveMessage = (data: any) => {
  //     // Only add message if it belongs to the currently selected chat
  //     if (
  //       selectedUser &&
  //       (
  //         (data.senderId === selectedUser.id && data.receiverId === myUserId) ||
  //         (data.senderId === myUserId && data.receiverId === selectedUser.id)
  //       )
  //     ) {
  //       setMessages(prev => {
  //         const exists = prev.some(m => m.id === data.id);
  //         if (exists) {
  //           console.log('Duplicate message detected:', data.id);
  //         }
  //         return exists ? prev : [...prev, data];
  //       });
  //     } else if (data.receiverId === myUserId) {
  //       // Message for another chat, increment unread count
  //       setUnreadCounts(prev => ({
  //         ...prev,
  //         [data.senderId]: (prev[data.senderId] || 0) + 1
  //       }));
  //     }
  //     // Emit message_delivered for this message
  //     socket.emit('message_delivered', {
  //       messageId: data.id || data.messageId,
  //       receiverId: data.receiverId,
  //     });
  //   };
  //   socket.on('receive_message', handleReceiveMessage);
  //   return () => {
  //     socket.off('receive_message', handleReceiveMessage);
  //   };
  // }, [socket, selectedUser, myUserId]);

  // useEffect(() => {
  //   if (!socket) return;
  //   // ... online/offline status handlers ...
  // }, [socket]);

  // useEffect(() => {
  //   if (!socket) return;
  //   // ... delivery/seen handlers ...
  // }, [socket]);

  // useEffect(() => {
  //   if (!socket) return;
  //   // ... reaction handlers ...
  // }, [socket]);

  // useEffect(() => {
  //   if (!socket || !selectedUser) return;
  //   // ... mark as seen logic ...
  // }, [socket, selectedUser, messages]);

  // useEffect(() => {
  //   if (!socket) return;
  //   // ... typing handlers ...
  // }, [socket]);

  // --- END SOCKET LOGIC ---

  // Use the custom socket handlers hook
  useChatSocketHandlers({
    socket,
    myUserId,
    selectedUser,
    setMessages,
    setUsers,
    setUnreadCounts,
    setTypingUsers,
    messages,
    users,
  });

  // Restore UI handler functions (not socket event listeners)
  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    setUnreadCounts(prev => ({ ...prev, [user.id]: 0 }));
    try {
      const response = await CHAT_CONVERSATION(user.id);
      if (response && response.status === 200) {
        setMessages(response.data?.messages || []);
      } else {
        setMessages([]);
        toast.error(response.data?.message || 'Failed to fetch chat history');
      }
    } catch (error) {
      setMessages([]);
      toast.error('Failed to fetch chat history');
    }
    // Emit event to backend with selected user id
    if (socket && user.id) {
      socket.emit('open_chat', { selectedUserId: user.id });
      // Also emit to reset unread count for this user
      socket.emit('reset_unread_count', { userId: user.id });
    }
  };

  const menuOptions: FloatingMenuOption[] = [
    { icon: <span>@</span>, label: 'Mentions', badge: 1, onClick: () => { } },
    { icon: <MdOutlineEdit />, label: 'New Direct Message', onClick: () => { } },
    { icon: <HiOutlineUserGroup />, label: 'New Group', onClick: () => { } },
    { icon: <MdOutlineDarkMode />, label: 'Dark Mode', onClick: () => { } },
    { icon: <MdPersonOutline />, label: 'Sign Out', onClick: logout },
  ];

  const handleReactToMessage = (messageId: string, emoji: string) => {
    if (!socket || !selectedUser) return;
    // Optimistically update the UI for the reacting user
    setMessages(prevMsgs => prevMsgs.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...(msg.reactions || {}) };
        reactions[myUserId] = emoji;
        return { ...msg, reactions };
      }
      return msg;
    }));
    // Emit the reaction to the backend
    socket.emit('react_to_message', {
      messageId,
      receiverId: selectedUser.id,
      reaction: emoji,
    });
  };

  const handleRemoveReaction = (messageId: string) => {
    setMessages(prevMsgs => prevMsgs.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...(msg.reactions || {}) };
        delete reactions[myUserId];
        return { ...msg, reactions };
      }
      return msg;
    }));
    setReactionRemoveOpenId(null);
    // Emit the reaction removal to the backend
    if (socket && selectedUser) {
      socket.emit('remove_reaction', {
        messageId,
        receiverId: selectedUser.id,
      });
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (!socket || !selectedUser) return;
    socket.emit('typing', { receiverId: selectedUser.id, isTyping: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { receiverId: selectedUser.id });
    }, 1200);
  };

  const handleSend = () => {
    if (!socket) {
      toast.error('Socket not connected');
      return;
    }
    if (!selectedUser || !input.trim()) return;
    if (editingMessage) {
      socket.emit('edit_message', {
        _id: editingMessage._id,
        newContent: input,
        editorId: myUserId,
      });
      setEditingMessage(null);
      setInput('');
      setReplyToMessage(null);
      return;
    }
    socket.emit('send_message', {
      senderId: myUserId,
      receiverId: selectedUser.id,
      content: input,
      replyToMessageId: replyToMessage ? (replyToMessage._id || replyToMessage.id) : null
    });
    setInput('');
    setReplyToMessage(null);
  };

  const handleEmojiSelect = (emoji: any) => {
    setInput(input + (emoji.native || (emoji.unified ? String.fromCodePoint(...emoji.unified.split('-').map((u: string) => parseInt(u, 16))) : '')));
    // Do NOT close the emoji picker here
  };

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setInput('');
      setReplyToMessage(message);
    }
  };



  const handleThreadReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setInput(`Thread reply to: ${message.content} `);
      toast.info('Thread reply mode activated');
    }
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId || m._id === messageId);
    if (message) {
      setInput(message.content);
      setEditingMessage(message);
    }
  };

  const handlePinMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      toast.success(`"${message.content}" pinned to conversation`);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    // Optimistically remove the message from UI
    setMessages(prev => prev.filter(msg => msg.id !== messageId));

    // Emit delete_message with required parameters
    if (socket && message && selectedUser) {
      const deleteData = {
        messageId: messageId,
        senderId: message.senderId,
        receiverId: selectedUser.id
      };
      socket.emit('delete_message', deleteData);
    } else {
      console.error('Cannot emit delete_message:', {
        socket: !!socket,
        message: !!message,
        selectedUser: !!selectedUser
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result as string }));
        if (socket) {
          socket.emit('update_profile', { avatar: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
      objectUrlsRef.current.push(URL.createObjectURL(file));
    }
  };

  const handleLogout = () => {
    // dispatch(clearToken());
    logout();
    // toast.success('Signed out successfully');
    setSelectedUser(null);
    setMessages([]);
    setUnreadCounts({});
    setInput('');
  };

  console.log(unreadCounts, "unreadCounts-------------->");

  return (
    <div className={styles.chatContainer}>
      <ChatSidebar
        users={users}
        selectedUser={selectedUser}
        onUserSelect={handleUserSelect}
        loading={loading}
        unreadCounts={unreadCounts}
        myUserId={myUserId}
        typingUsers={typingUsers}
        getLastSeenStatus={getLastSeenStatus}
        onMenu={open => {
          setShowMenuModal(open);
          setMenuHover(open);
        }}
      />
      <FloatingMenuModal
        open={showMenuModal || menuHover}
        onClose={() => {
          setShowMenuModal(false);
          setMenuHover(false);
        }}
        options={menuOptions}
        user={{ avatar: profile.avatar, name: userName }}
        theme={mode}
        toggleTheme={toggleTheme}
        onMouseEnter={() => setMenuHover(true)}
        onMouseLeave={() => {
          setMenuHover(false);
          setShowMenuModal(false);
        }}
      />
      <main className={styles.chatMain}>
        <ChatHeader
          selectedUser={selectedUser}
          unreadCount={selectedUser ? unreadCounts[selectedUser.id] || 0 : 0}
          getLastSeenStatus={getLastSeenStatus}
          onSettings={() => setShowSettings(true)}
        // onMenu={...} // Add if you want to handle menu
        />
        <div
          ref={chatBodyRef}
          className={styles.chatBody}
          style={{ flex: 1, overflowY: 'auto', padding: '0px 10px 12px 10px' }}
        >
          <MessageList
            messages={messages}
            myUserId={myUserId}
            selectedUser={selectedUser}
            onReact={handleReactToMessage}
            onRemoveReaction={handleRemoveReaction}
            emojiBarOpenId={emojiBarOpenId}
            setEmojiBarOpenId={setEmojiBarOpenId}
            reactionRemoveOpenId={reactionRemoveOpenId}
            setReactionRemoveOpenId={setReactionRemoveOpenId}
            setImageModal={setImageModal}
            openYouTubePlayers={openYouTubePlayers}
            setOpenYouTubePlayers={setOpenYouTubePlayers}
            typingUsers={typingUsers}
            showScrollToBottom={false}
            chatEndRef={chatEndRef}
            onScrollToBottom={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            onDelete={handleDeleteMessage}
            onReply={handleReply}
            onThreadReply={handleThreadReply}
            onEdit={handleEditMessage}
          />
        </div>
        <ChatInput
          input={input}
          setInput={handleInputChange}
          onSend={handleSend}
          file={file}
          setFile={setFile}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          handleEmojiSelect={handleEmojiSelect}
          replyToMessage={replyToMessage}
          setReplyToMessage={setReplyToMessage}
        />
        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            className={styles.chatScrollToBottomBtn}
            onClick={() => {
              if (chatBodyRef.current) {
                chatBodyRef.current.scrollTo({
                  top: chatBodyRef.current.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }}
            aria-label="Scroll to latest message"
            title="Scroll to latest message"
          >
            <MdOutlineKeyboardArrowDown style={{ color: '#1976d2', fontSize: '27px' }} />
          </button>
        )}
      </main>
      <ImageModal
        open={imageModal.open && !!selectedUser}
        imageUrl={imageModal.url}
        imageName={imageModal.name}
        user={{
          avatar: selectedUser?.avatar || '',
          name: selectedUser?.name || '',
          online: selectedUser?.online,
        }}
        onClose={() => setImageModal({ open: false, url: '', name: '' })}
      />

      <SettingsModal
        open={showSettings}
        profile={profile}
        errors={{
          name: profileErrors.name?.message as string,
          description: profileErrors.description?.message as string,
        }}
        onChange={e => {
          const { name, value } = e.target;
          setProfile(prev => ({ ...prev, [name]: value }));
        }}
        onSave={handleProfileSubmit(onProfileSave)}
        onClose={() => setShowSettings(false)}
        onAvatarChange={handleAvatarChange}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default ChatScreen;