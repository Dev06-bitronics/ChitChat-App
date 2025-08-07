import React, { useRef, useState, useEffect, useMemo } from 'react';
import { MdOutlineEdit } from "react-icons/md";
import { HiOutlineUserGroup } from "react-icons/hi";
import { MdOutlineDarkMode, MdPersonOutline, MdOutlineKeyboardArrowDown } from "react-icons/md";
//@ts-ignore
import styles from './ChatScreen.module.css';
import { useForm } from 'react-hook-form';
import FloatingMenuModal, { FloatingMenuOption } from '@/components/FloatingMenuModal/FloatingMenuModal';
import { useTheme } from '@/theme/themeContext';
import { useSelector } from 'react-redux';
import { getLastSeenStatus } from '@/utils/helperFunctions';
import { MESSAGES, UI } from '@/constants';
import { toast } from 'react-toastify';
import { ALL_USERS, CHAT_CONVERSATION } from '@/api/api';
import ImageModal from '@/components/ImageModal/ImageModal';
import SettingsModal from '@/components/SettingsModal/SettingsModal';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';
import ManageUsersModal from '@/components/AddUsersModal/AddUsersModal';
import { useSocketContext } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatSidebar from './ChatSidebar';
import { useChatSocketHandlers } from './useChatSocketHandlers';
import { Message, User, GroupChat } from './ChatScreen.types';
import ChatHeader from './ChatHeader';
import { PinnedMessages } from '@/components/PinnedMessages/PinnedMessages';
import GroupModal from '@/components/GroupModal/GroupModal';


const ChatScreen: React.FC = () => {
  const myUserId = useSelector((state: any) => state.user.id);
  const token = useSelector((state: any) => state.user.token);
  const [users, setUsers] = useState<(User | GroupChat)[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [deleteGroupConfirmation, setDeleteGroupConfirmation] = useState<{
    open: boolean;
    groupId: string;
    groupName: string;
  }>({
    open: false,
    groupId: '',
    groupName: '',
  });

  const [leaveGroupConfirmation, setLeaveGroupConfirmation] = useState<{
    open: boolean;
    groupId: string;
    groupName: string;
  }>({
    open: false,
    groupId: '',
    groupName: '',
  });

  const [showManageUsersModal, setShowManageUsersModal] = useState<boolean>(false);
  const [manageUsersMode, setManageUsersMode] = useState<'add' | 'remove'>('add');
  const [selectedGroupForManageUsers, setSelectedGroupForManageUsers] = useState<{
    groupId: string;
    groupName: string;
    participants: string[];
  } | null>(null);
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
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);
  const objectUrlsRef = useRef<string[]>([]);
  const messageListRef = useRef<HTMLDivElement>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { mode, toggleTheme } = useTheme();
  const { logout } = useAuth();

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
    setPinnedMessages,
    onGroupDeleted: () => toast.success(MESSAGES.CHAT.GROUP_DELETED_SUCCESS),
    onGroupDeletionError: (error: string) => toast.error(error),
    onUsersAddedToGroup: (data: { addedUsers: Array<{ name: string }>; addedBy: { name: string } }) => {
      const userNames = data.addedUsers.map(user => user.name).join(', ');
      toast.success(MESSAGES.CHAT.USERS_ADDED_TO_GROUP(data.addedBy.name, userNames));
      setShowManageUsersModal(false);
      setSelectedGroupForManageUsers(null);
    },
    onAddUsersError: (error: string) => toast.error(error),
    onUsersRemovedFromGroup: (data: { removedUsers: Array<{ name: string }>; removedBy: { name: string } }) => {
      const userNames = data.removedUsers.map(user => user.name).join(', ');
      toast.success(MESSAGES.CHAT.USERS_REMOVED_FROM_GROUP(data.removedBy.name, userNames));
      setShowManageUsersModal(false);
      setSelectedGroupForManageUsers(null);
    },
    onRemoveUsersError: (error: string) => toast.error(error),
    onUserLeftGroup: () => {
      // Select the first available user when current user leaves a group
      if (users.length > 0) {
        const firstUser = users[0];
        setSelectedUser(firstUser);
        handleUserSelect(firstUser);
      } else {
        setSelectedUser(null);
      }
    },
  });



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
    const updated = users.find(u => u._id === selectedUser._id);
    if (updated && !selectedUser.isGroup && !updated.isGroup) {
      if (updated.isOnline !== selectedUser.isOnline || updated.online !== selectedUser.online) {
        setSelectedUser(updated);
      }
    }
  }, [users, selectedUser]);

  // Utility: Mark all messages from the other user as seen when chat is opened or messages change
  useEffect(() => {
    if (!socket || !selectedUser) return;
    // Find all messages from the selected user that are not yet seen
    const unseenMessages = messages.filter(
      msg => msg.senderId?._id === selectedUser._id && msg.status !== 'seen'
    );
    unseenMessages.forEach(msg => {
      socket.emit('mark_as_seen', { messageId: msg._id, receiverId: selectedUser._id });
    });
  }, [socket, selectedUser, messages]);

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

  // Listen for message_pinned events from other users
  useEffect(() => {
    if (!socket) return;

    const handleMessagePinned = (data: {
      messageId: string;
      isPinned: boolean;
      message?: Message;
    }) => {
      console.log('Message pinned event received:', data);

      // Update the message's pinned status in the messages array
      setMessages(prevMsgs => prevMsgs.map(msg =>
        msg._id === data.messageId ? { ...msg, isPinned: data.isPinned } : msg
      ));

      // Update pinned messages array
      if (data.isPinned) {
        // Add to pinned messages
        const messageToPin = messages.find(msg => msg._id === data.messageId) || data.message;
        if (messageToPin) {
          setPinnedMessages(prev => {
            // Check if already pinned to avoid duplicates
            const isAlreadyPinned = prev.some(msg => msg._id === data.messageId);
            if (!isAlreadyPinned) {
              return [...prev, { ...messageToPin, isPinned: true }];
            }
            return prev;
          });
        }
      } else {
        setPinnedMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
      toast.info(data.isPinned ? MESSAGES.CHAT.MESSAGE_PINNED : MESSAGES.CHAT.MESSAGE_UNPINNED);
    };

    socket.on('message_pinned', handleMessagePinned);
    return () => {
      socket.off('message_pinned', handleMessagePinned);
    };
  }, [socket, messages]);

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
        console.log('ALL_USERS API response:', response.data?.data);
        const fetchedUsers = response.data?.data?.map((item: any) => {
          if (item.isGroup) {
            // Handle new API format with participants and pendingParticipants
            const joinedParticipants = item.participants || [];
            const pendingParticipants = item.pendingParticipants || [];
            const allParticipants = [...joinedParticipants, ...pendingParticipants];

            const group: GroupChat = {
              _id: item.conversationId,
              name: item.groupName,
              avatar: item.groupAvatar || undefined,
              participants: allParticipants,
              participantsStatus: allParticipants.reduce((acc: any, participant: string) => {
                // Users in participants array are 'joined', users in pendingParticipants are 'pending'
                acc[participant] = joinedParticipants.includes(participant) ? 'joined' : 'pending';
                return acc;
              }, {}),
              createdBy: typeof item.createdBy === 'object' ? item.createdBy._id : item.createdBy,
              isGroup: true,
              lastMessage: item.lastMessage || null,
              lastMessageTimestamp: item.lastMessageTimestamp,
              unreadCount: item.unreadCount || 0
            };
            console.log('Transformed group from API:', {
              groupId: group._id,
              groupName: group.name,
              joinedParticipants,
              pendingParticipants,
              participantsStatus: group.participantsStatus,
              myUserId,
              myStatus: group.participantsStatus?.[myUserId]
            });
            return group;
          } else {
            return {
              ...item,
              online: Math.random() > 0.5,
              lastMessage: item.lastMessage
            };
          }
        });
        setUsers(fetchedUsers);
        if (fetchedUsers.length > 0 && !selectedUser) {
          // Find the first non-group user to select initially
          const firstUser = fetchedUsers.find((user: any) => !user.isGroup) || fetchedUsers[0];
          setSelectedUser(firstUser);

          // Only fetch conversation if it's not a group
          if (!firstUser.isGroup) {
            try {
              const chatRes = await CHAT_CONVERSATION(firstUser._id);
              if (chatRes && chatRes.status === 200) {
                console.log(chatRes.data?.messages, "first chat messages");
                const fetchedMessages = chatRes.data?.messages || [];
                setMessages(fetchedMessages);

                // Load pinned messages for initial conversation
                const pinned = fetchedMessages.filter((msg: Message) => msg.isPinned);
                setPinnedMessages(pinned);
                console.log('Loaded initial pinned messages:', pinned);
              } else {
                setMessages([]);
                setPinnedMessages([]);
              }
            } catch {
              setMessages([]);
            }
          } else {
            setMessages([]);
            setPinnedMessages([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(MESSAGES.CHAT.FAILED_TO_FETCH_USERS);
    } finally {
      setLoading(false);
    }
  };



  // Restore UI handler functions (not socket event listeners)
  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    setUnreadCounts(prev => ({ ...prev, [user._id]: 0 }));

    try {
      const response = await CHAT_CONVERSATION(user._id);
      if (response && response.status === 200) {
        console.log('Fetched chat history for user:', response.data?.messages);
        const fetchedMessages = response.data?.messages || [];
        setMessages(fetchedMessages);

        // Load pinned messages for this conversation
        const pinned = fetchedMessages.filter((msg: Message) => msg.isPinned);
        setPinnedMessages(pinned);
        console.log('Loaded pinned messages:', pinned);

      } else {
        setMessages([]);
        setPinnedMessages([]);
        toast.error(response.data?.messages || MESSAGES.CHAT.CHAT_HISTORY_FAILED);
      }
    } catch (error) {
      setMessages([]);
      setPinnedMessages([]);
      toast.error(MESSAGES.CHAT.CHAT_HISTORY_FAILED);
    }

    // Emit event to backend with selected user id
    if (socket && user._id) {
      socket.emit('open_chat', { selectedUserId: user._id });
      socket.emit('reset_unread_count', { userId: user._id });
    }
  };
  const menuOptions: FloatingMenuOption[] = [
    { icon: <span>@</span>, label: UI.MENU.MENTIONS, badge: 1, onClick: () => { } },
    { icon: <MdOutlineEdit />, label: UI.MENU.NEW_DIRECT_MESSAGE, onClick: () => { } },
    { icon: <HiOutlineUserGroup />, label: UI.MENU.NEW_GROUP, onClick: () => {
      setShowGroupModal(true);
      setShowMenuModal(false);
      setMenuHover(false);
    }},
    { icon: <MdOutlineDarkMode />, label: UI.MENU.DARK_MODE, onClick: () => { } },
    { icon: <MdPersonOutline />, label: UI.MENU.SIGN_OUT, onClick: () => {
      logout();
      setShowMenuModal(false);
      setMenuHover(false);
    }},
  ];

  const handleReactToMessage = (messageId: string, emoji: string) => {
    if (!socket || !selectedUser) return;
    // Optimistically update the UI for the reacting user
    setMessages(prevMsgs => prevMsgs.map(msg => {
      if (msg._id === messageId) {
        const reactions = { ...(msg.reactions || {}) };
        reactions[myUserId] = emoji;
        return { ...msg, reactions };
      }
      return msg;
    }));
    // Emit the reaction to the backend
    socket.emit('react_to_message', {
      messageId,
      receiverId: selectedUser._id,
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
    socket.emit('typing', { receiverId: selectedUser._id, isTyping: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { receiverId: selectedUser._id });
    }, 1200);
  };
  console.log("hitted==============>")
  const handleSend = () => {
    if (!socket || !selectedUser || !input.trim()) return;

    // If we're editing a message, handle edit instead of sending new message
    if (editingMessage) {
      handleSaveEdit();
      return;
    }

    // Check if this is a group and if user has joined
    if (selectedUser.isGroup) {
      const userStatus = selectedUser.participantsStatus?.[myUserId];
      const isCreator = selectedUser.createdBy === myUserId;
      if (userStatus !== 'joined' && !isCreator) {
        toast.error(MESSAGES.CHAT.MUST_JOIN_GROUP);
        return;
      }
    }

    const messageData = {
      senderId: myUserId,
      content: input,
      replyToMessageId: replyToMessage?._id || null
    };

    if (selectedUser.isGroup) {
      console.log('Sending group message:', {
        ...messageData,
        groupId: selectedUser._id
      });
      socket.emit('send_group_message', {
        ...messageData,
        groupId: selectedUser._id
      });
    } else {
      console.log('Sending direct message:', {
        ...messageData,
        receiverId: selectedUser._id,
        myUserId,
        selectedUserName: selectedUser.name
      });
      socket.emit('send_message', {
        ...messageData,
        receiverId: selectedUser._id
      }, (response: any) => {
        console.log('Send message callback response:', response);
        if (response && response.success) {
          console.log('Message sent successfully:', response.message);
        } else {
          console.error('Message send failed:', response);
        }
      });
    }

    setInput('');
    setReplyToMessage(null);
  };

  const handleEmojiSelect = (emoji: any) => {
    setInput(input + (emoji.native || (emoji.unified ? String.fromCodePoint(...emoji.unified.split('-').map((u: string) => parseInt(u, 16))) : '')));
  };

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m._id === messageId);
    if (message) {
      setInput('');
      setReplyToMessage(message);
    }
  };

  const handleThreadReply = (messageId: string) => {
    const message = messages.find(m => m._id === messageId);
    if (message) {
      setInput(`Thread reply to: ${message.content} `);
      toast.info(MESSAGES.CHAT.THREAD_REPLY_ACTIVATED);
    }
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId || m._id === messageId);
    if (message) {
      setInput(message.content);
      setEditingMessage(message);
      setReplyToMessage(null); // Clear any reply when editing
    }
  };

  const handleSaveEdit = () => {
    if (!socket || !editingMessage || !input.trim()) return;

    console.log('Editing message:', {
      messageId: editingMessage._id,
      newContent: input.trim(),
      editorId: myUserId
    });

    socket.emit('edit_message', {
      messageId: editingMessage._id,
      newContent: input.trim(),
      editorId: myUserId
    });

    // Clear edit state immediately since the message is being edited successfully
    // Error handling will be done via the edit_error_message socket event
    setEditingMessage(null);
    setInput('');
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInput('');
  };

  // Calculate disabled state for ChatInput
  const chatInputDisabled = useMemo(() => {
    const isDisabled = selectedUser?.isGroup && selectedUser.participantsStatus?.[myUserId] !== 'joined' && selectedUser.createdBy !== myUserId;
    console.log('ChatInput disabled check:', {
      isGroup: selectedUser?.isGroup,
      myUserId,
      myStatus: selectedUser?.participantsStatus?.[myUserId],
      createdBy: selectedUser?.createdBy,
      isCreator: selectedUser?.createdBy === myUserId,
      isDisabled
    });
    return isDisabled;
  }, [selectedUser?.isGroup, selectedUser?.participantsStatus, selectedUser?.createdBy, myUserId]);

  const handlePinMessage = (message: Message) => {
    if (!socket || !selectedUser) return;

    const isCurrentlyPinned = message.isPinned === true; // Explicitly check for true
    console.log('🔥 HANDLE PIN - handlePinMessage called:', {
      messageId: message._id,
      isPinnedProperty: message.isPinned,
      isCurrentlyPinned,
      action: isCurrentlyPinned ? 'unpin_message' : 'pin_message'
    });

    // Don't update UI optimistically, let socket events handle it
    socket.emit(isCurrentlyPinned ? 'unpin_message' : 'pin_message', {
      messageId: message._id,
      conversationId: message.conversationId || selectedUser._id,
      userId: myUserId,
      receiverId: selectedUser._id
    });
  };

  const scrollToMessage = (messageId: string) => {
    console.log(messageId, "scrolling to message");
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add(styles.highlighted);
      setTimeout(() => {
        messageElement.classList.remove(styles.highlighted);
      }, 2000);
    } else {
      console.log('Message element not found:', messageId);
    }
  };

  const handlePinnedMessageClick = (messageId: string) => {
    scrollToMessage(messageId);
  };

  const handleDeleteMessage = (messageId: string) => {
    const message = messages.find(m => m._id === messageId);
    // Optimistically remove the message from UI
    setMessages(prev => prev.filter(msg => msg._id !== messageId));

    if (socket && message && selectedUser) {
      const deleteData = {
        messageId: messageId,
        senderId: message.senderId?._id,
        receiverId: selectedUser._id
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

  const handleCreateGroup = (name: string, selectedUsers: User[]) => {
    if (!socket) {
      toast.error(MESSAGES.NETWORK.SOCKET_NOT_AVAILABLE);
      return;
    }

    const participants = [myUserId, ...selectedUsers.map(user => user._id)];

    socket.emit('create_group', {
      groupName: name || 'New Group',
      groupAvatar: '',
      participants,
      createdBy: myUserId
    }, (response: any) => {
      console.log('Group creation callback response:', response);
      if (response.success) {
        toast.success(MESSAGES.CHAT.GROUP_CREATED_SUCCESS);
        setShowGroupModal(false);
      } else {
        toast.error(response.error || MESSAGES.CHAT.GROUP_CREATION_FAILED);
      }
    });
  };

  const handleJoinGroup = (groupId: string) => {
    if (!socket) {
      toast.error(MESSAGES.NETWORK.SOCKET_NOT_AVAILABLE);
      return;
    }

    socket.emit('join_group', { groupId }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        toast.success(MESSAGES.CHAT.GROUP_JOINED_SUCCESS);
      } else {
        toast.error(response.error || MESSAGES.CHAT.GROUP_JOIN_FAILED);
      }
    });
  };

  const handleLeaveGroup = (groupId: string) => {
    if (!socket) {
      toast.error(MESSAGES.NETWORK.SOCKET_NOT_AVAILABLE);
      return;
    }

    const group = users.find(u => u._id === groupId);
    setLeaveGroupConfirmation({
      open: true,
      groupId: groupId,
      groupName: group?.name || 'this group',
    });
  };

  const handleConfirmLeaveGroup = () => {
    if (!socket) {
      toast.error(MESSAGES.NETWORK.SOCKET_NOT_AVAILABLE);
      return;
    }

    socket.emit('leave_group', { conversationId: leaveGroupConfirmation.groupId, userId: myUserId });
    setLeaveGroupConfirmation({ open: false, groupId: '', groupName: '' });
  };

  const handleCancelLeaveGroup = () => {
    setLeaveGroupConfirmation({ open: false, groupId: '', groupName: '' });
  };

  const handleAddUsers = (groupId: string) => {
    const group = users.find(u => u._id === groupId);
    if (group && group.isGroup) {
      setSelectedGroupForManageUsers({
        groupId: groupId,
        groupName: group.name,
        participants: group.participants || []
      });
      setManageUsersMode('add');
      setShowManageUsersModal(true);
    }
  };

  const handleRemoveUsers = (groupId: string) => {
    const group = users.find(u => u._id === groupId);
    if (group && group.isGroup) {
      setSelectedGroupForManageUsers({
        groupId: groupId,
        groupName: group.name,
        participants: group.participants || []
      });
      setManageUsersMode('remove');
      setShowManageUsersModal(true);
    }
  };

  const handleConfirmAddUsers = (groupId: string, selectedUserIds: string[]) => {
    if (!socket) {
      toast.error(MESSAGES.NETWORK.SOCKET_NOT_AVAILABLE);
      return;
    }

    // Get the names of selected users for better system message
    const selectedUserNames = selectedUserIds.map(userId => {
      const user = users.find(u => u._id === userId);
      return user?.name || 'Unknown User';
    });

    socket.emit('add_users_to_group', {
      conversationId: groupId,
      participants: selectedUserIds,
      requestedBy: myUserId,
      selectedUserNames: selectedUserNames
    });
  };

  const handleCloseManageUsersModal = () => {
    setShowManageUsersModal(false);
    setSelectedGroupForManageUsers(null);
  };

  const handleConfirmRemoveUsers = (groupId: string, selectedUserIds: string[]) => {
    if (!socket) {
      toast.error(MESSAGES.NETWORK.SOCKET_NOT_AVAILABLE);
      return;
    }

    socket.emit('user_removed_from_group', {
      conversationId: groupId,
      participants: selectedUserIds,
      requestedBy: myUserId
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!socket) {
      toast.error(MESSAGES.NETWORK.SOCKET_NOT_AVAILABLE);
      return;
    }

    const group = users.find(u => u._id === groupId);
    setDeleteGroupConfirmation({
      open: true,
      groupId: groupId,
      groupName: group?.name || 'this group',
    });
  };

  const handleConfirmDeleteGroup = () => {
    if (!socket) {
      toast.error(MESSAGES.NETWORK.SOCKET_NOT_AVAILABLE);
      return;
    }

    socket.emit('delete_group', {
      conversationId: deleteGroupConfirmation.groupId,
      requestedBy: myUserId
    });

    setDeleteGroupConfirmation({ open: false, groupId: '', groupName: '' });
  };

  const handleCancelDeleteGroup = () => {
    setDeleteGroupConfirmation({ open: false, groupId: '', groupName: '' });
  };

  console.log(myUserId, "users-------------->");

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
          unreadCount={selectedUser ? unreadCounts[selectedUser.id || selectedUser._id] || 0 : 0}
          getLastSeenStatus={getLastSeenStatus}
          onSettings={() => setShowSettings(true)}
          myUserId={myUserId}
          onLeaveGroup={handleLeaveGroup}
          onDeleteGroup={handleDeleteGroup}
          onAddUsers={handleAddUsers}
          onRemoveUsers={handleRemoveUsers}
        />
        {pinnedMessages.length > 0 && (
          <PinnedMessages
            pinnedMessages={pinnedMessages}
            onPinnedMessageClick={handlePinnedMessageClick}
          />
        )}
        <div
          ref={chatBodyRef}
          className={styles.chatBody}
          style={{ flex: 1, overflowY: 'auto', padding: '0px 10px 12px 10px' }}
        >
          <MessageList
            messages={messages}
            myUserId={myUserId}
            selectedUser={selectedUser}
            pinnedMessages={pinnedMessages}
            onPin={handlePinMessage}
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
            onJoinGroup={handleJoinGroup}
            users={users}
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
          editingMessage={editingMessage}
          onCancelEdit={handleCancelEdit}
          disabled={chatInputDisabled}
          disabledMessage={selectedUser?.isGroup ? "You must join the group to send messages" : "You cannot send messages"}
        />
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
      <GroupModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        myUserId={myUserId}
        onCreateGroup={handleCreateGroup}
      />

      <ConfirmationModal
        open={deleteGroupConfirmation.open}
        title="Delete Group"
        message={`Are you sure you want to permanently delete "${deleteGroupConfirmation.groupName}"? This action cannot be undone and all messages will be lost.`}
        confirmText="DELETE"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteGroup}
        onCancel={handleCancelDeleteGroup}
      />

      <ConfirmationModal
        open={leaveGroupConfirmation.open}
        title="Leave Group"
        message={`Are you sure you want to leave "${leaveGroupConfirmation.groupName}"? Once you leave the group, you cannot be added back until an admin adds you to the group.`}
        confirmText="LEAVE"
        cancelText="Cancel"
        onConfirm={handleConfirmLeaveGroup}
        onCancel={handleCancelLeaveGroup}
      />

      {selectedGroupForManageUsers && (
        <ManageUsersModal
          open={showManageUsersModal}
          onClose={handleCloseManageUsersModal}
          allUsers={users.filter(user => !user.isGroup) as User[]}
          groupId={selectedGroupForManageUsers.groupId}
          groupName={selectedGroupForManageUsers.groupName}
          currentParticipants={selectedGroupForManageUsers.participants}
          onAddUsers={handleConfirmAddUsers}
          onRemoveUsers={handleConfirmRemoveUsers}
          mode={manageUsersMode}
          myUserId={myUserId}
        />
      )}
    </div>
  );
};

export default ChatScreen;