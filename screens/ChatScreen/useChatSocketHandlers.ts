
import { useEffect } from 'react';
import { Message, User, GroupChat } from './ChatScreen.types';
import { MESSAGES } from '@/constants';
import { toast } from 'react-toastify';

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
  setPinnedMessages,
  onGroupDeleted,
  onGroupDeletionError,
  onUsersAddedToGroup,
  onAddUsersError,
  onUsersRemovedFromGroup,
  onRemoveUsersError,
  onUserLeftGroup,
}: {
  socket: any;
  myUserId: string;
  selectedUser: User | GroupChat | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setUsers: React.Dispatch<React.SetStateAction<(User | GroupChat)[]>>;
  setUnreadCounts: React.Dispatch<React.SetStateAction<{ [userId: string]: number }>>;
  setTypingUsers: React.Dispatch<React.SetStateAction<{ [userId: string]: boolean }>>;
  messages: Message[];
  users: (User | GroupChat)[];
  setPinnedMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onGroupDeleted?: () => void;
  onGroupDeletionError?: (error: string) => void;
  onUsersAddedToGroup?: (data: { addedUsers: Array<{ name: string }>; addedBy: { name: string } }) => void;
  onAddUsersError?: (error: string) => void;
  onUsersRemovedFromGroup?: (data: { removedUsers: Array<{ name: string }>; removedBy: { name: string } }) => void;
  onRemoveUsersError?: (error: string) => void;
  onUserLeftGroup?: () => void;
}): void {

  // Connection events
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('Socket connected with ID:', socket.id, 'for user:', myUserId);
      socket.emit('join_room', myUserId);
      console.log('Emitted join_room for user:', myUserId);
    };

    const handleConnectError = (err: any) => {
      console.error('Connection Error:', err.message);
      socket.connect();
    };

    if (socket.connected) {
      console.log('Socket already connected, joining room for user:', myUserId);
      socket.emit('join_room', myUserId);
    }

    const handleError = (error: any) => {
      console.error('Socket error:', error);
    };

    const handleDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('error', handleError);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('error', handleError);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, myUserId]);

  // Incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data: Message) => {
      console.log(data, "Received receive_message event in useChatSocketHandlers");
      const senderId = data.senderId?._id;
      const receiverId = data.receiverId?._id;
      const groupId = data.groupId;

      // Fix conversation matching logic for direct messages
      let isCurrentConversation = false;
      if (groupId) {
        // For group messages, check if current selected user is the group
        isCurrentConversation = selectedUser?._id === groupId;
      } else {
        // For direct messages, check if the conversation involves the selected user
        // The selected user should be either the sender or receiver of the message
        isCurrentConversation = selectedUser?._id === senderId || selectedUser?._id === receiverId;
      }

      console.log('Message routing check:', {
        senderId,
        receiverId,
        groupId,
        selectedUserId: selectedUser?._id,
        myUserId,
        isCurrentConversation
      });

      // Always add the message if it belongs to current conversation
      if (isCurrentConversation) {
        setMessages(prev => {
          const exists = prev.some(m => m._id === data._id);
          console.log('Adding message to current conversation:', { messageId: data._id, exists });
          return exists ? prev : [...prev, data];
        });
      }

      if (!isCurrentConversation) {
        // For unread counts, use the conversation partner's ID
        let targetId: string | undefined;
        if (groupId) {
          targetId = groupId;
        } else {
          // For direct messages, the target is the other person in the conversation
          targetId = senderId === myUserId ? receiverId : senderId;
        }

        if (targetId) {
          console.log('Updating unread count for:', targetId);
          setUnreadCounts(prev => ({
            ...prev,
            [targetId]: (prev[targetId] ?? 0) + 1
          }));
        }
      }

      // Send delivery receipt for direct messages
      if (!groupId && receiverId === myUserId) {
        socket.emit('message_delivered', {
          messageId: data._id,
          receiverId: senderId,
        });
      }

      // For groups, update last message in users list
      if (groupId) {
        setUsers(prev => prev.map(user =>
          user._id === groupId ? {
            ...user,
            lastMessage: data.content,
            lastMessageSender: data.senderId,
            lastMessageTimestamp: data.timestamp
          } : user
        ));
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, selectedUser, myUserId, setMessages, setUnreadCounts, setUsers]);


  // Delivery/seen events
  useEffect(() => {
    if (!socket) return;
    const handleMessageDelivered = (data: { messageId: string }) => {
      console.log(data, "Received message_delivered event----------->");
      setMessages(prev => prev.map(msg => {
        // console.log(msg,data,"msg._id === data.messageId");
        return msg._id == data.messageId ? { ...msg, status: 'delivered' } : msg;
      }));
    };
    const handleMessageSeen = (data: { messageId: string }) => {
      // console.log(data, "Received message_seen event----------->");
      setMessages(prev => prev.map(msg => {
        // console.log(msg, data, "msg._id === data.messageId");
        return msg._id == data.messageId ? { ...msg, status: 'seen' } : msg
      }));
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
        msg._id === updatedMessage.messageId ? { ...msg, reactions: reactionsObj } : msg
      ));
    };
    socket.on('message_reacted', handleMessageReacted);
    return () => {
      socket.off('message_reacted', handleMessageReacted);
    };
  }, [socket, setMessages]);

  // Mark messages as seen when chat is opened or messages change
  // useEffect(() => {
  //   if (!socket || !selectedUser) return;
  //   // Find all messages from the selected user that are not yet seen
  //   const unseenMessages = messages.filter(
  //     msg => msg.senderId?._id === selectedUser._id && msg.status !== 'seen'
  //   );
  //   unseenMessages.forEach(msg => {
  //     socket.emit('mark_as_seen', { messageId: msg._id, receiverId: selectedUser._id, senderId: myUserId });
  //   });
  //   // Also emit to reset unread count when chat is opened
  //   socket.emit('reset_unread_count', { userId: selectedUser._id });
  // }, [socket, selectedUser, messages]);

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
      console.log(onlineUsers, "Received getOnlineUsers event in useChatSocketHandlers");
      setUsers(prevUsers => prevUsers.map(user => {
        const found = onlineUsers.find(u => u.userId === user._id);
        if (found) {
          return { ...user, isOnline: found.isOnline, online: found.isOnline, lastSeen: found.lastSeen || undefined };
        }
        return { ...user, isOnline: false };
      }));
    };
    const handleUserOnline = ({ userId, lastSeen }: { userId: string, lastSeen: string | null }) => {
      console.log(lastSeen, "Received userOnline event in useChatSocketHandlers");
      setUsers(prevUsers => prevUsers.map(user =>
        user._id === userId ? { ...user, online: true, isOnline: true, lastSeen: lastSeen || undefined } : user
      ));
    };
    const handleUserOffline = ({ userId, lastSeen }: { userId: string, lastSeen: string | null }) => {
      setUsers(prevUsers => prevUsers.map(user =>
        user._id === userId ? { ...user, online: false, isOnline: false, lastSeen: lastSeen || undefined } : user
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

    const handleLastMessageUpdate = (payload: { conversationId: string; lastMessage: any; participants: string[]; groupId?: string }) => {
      console.log(payload, "Received last_message_updated event in useChatSocketHandlers");

      const targetId = payload.groupId || payload.participants.find(p => p !== myUserId);
      if (!targetId) return;

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === targetId
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
        const filtered = prev.filter(msg => msg._id !== data.messageId);
        console.log('Messages after deletion:', filtered.length);
        return filtered;
      });
    };

    socket.on('message_deleted', handleMessageDeleted);
    return () => {
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, setMessages]);

  // Group events
  useEffect(() => {
    if (!socket) return;

    const handleGroupCreated = (response: any) => {
      console.log('Received group_created event:', response);

      // Check if this is the new format with pendingParticipants
      const allParticipants = response.participants || [];
      const pendingParticipants = response.pendingParticipants || [];
      const invitedBy = response.invitedBy;

      // Transform the response to match our GroupChat interface
      const group: GroupChat = {
        _id: response.conversationId,
        name: response.groupName,
        avatar: response.groupAvatar || undefined,
        participants: [...allParticipants, ...pendingParticipants], // All users (joined + pending)
        createdBy: invitedBy?._id || (typeof response.createdBy === 'object' ? response.createdBy._id : response.createdBy),
        isGroup: true,
        lastMessage: null,
        unreadCount: 0
      };

      console.log('Transformed group:', group);

      // Join the group room if I'm the creator
      if (group.createdBy === myUserId) {
        socket.emit('join_group', { groupId: group._id });
      }

      setUsers(prev => {
        const exists = prev.some(u => u._id === group._id);

        if (exists) {
          console.log('Group already exists, updating:', group._id);
          // Update existing group
          return prev.map(u => u._id === group._id ? {
            ...group,
            participantsStatus: group.participants.reduce((acc, participant) => {
              // Users in participants array are 'joined', users in pendingParticipants are 'pending'
              acc[participant] = allParticipants.includes(participant) ? 'joined' : 'pending';
              return acc;
            }, {} as { [userId: string]: 'joined' | 'pending' }),
            isGroup: true,
            lastMessage: u.lastMessage || null,
            lastMessageTimestamp: u.lastMessageTimestamp || new Date().toISOString(),
            unreadCount: u.unreadCount || 0
          } : u);
        }

        // Only add group if current user is in participants or pendingParticipants
        const isUserInvolved = allParticipants.includes(myUserId) || pendingParticipants.includes(myUserId);
        if (!isUserInvolved) {
          console.log('User not involved in group, skipping:', group._id);
          return prev;
        }

        // Initialize participants status
        const participantsStatus = group.participants.reduce((acc, participant) => {
          // Users in participants array are 'joined', users in pendingParticipants are 'pending'
          acc[participant] = allParticipants.includes(participant) ? 'joined' : 'pending';
          return acc;
        }, {} as { [userId: string]: 'joined' | 'pending' });

        console.log('Setting up group with participants status:', {
          groupId: group._id,
          allParticipants,
          pendingParticipants,
          participantsStatus,
          createdBy: group.createdBy,
          myUserId,
          myStatus: participantsStatus[myUserId]
        });

        // Show invitation message if user is pending
        if (pendingParticipants.includes(myUserId)) {
          toast.info(response.message || 'You have been invited to join the group.');
        }

        const newGroup = {
          ...group,
          participantsStatus,
          isGroup: true,
          lastMessage: null,
          lastMessageTimestamp: new Date().toISOString(),
          unreadCount: 0
        };

        console.log('Adding new group to users list:', newGroup);
        return [...prev, newGroup];
      });
    };

    const handleGroupUpdated = (updatedGroup: GroupChat) => {
      setUsers(prev => prev.map(u =>
        u._id === updatedGroup._id ? { ...u, ...updatedGroup, isGroup: true } : u
      ));
    };

    const handleGroupDeleted = (data: { conversationId: string; message?: string }) => {
      console.log('Received group_deleted event:', data);
      const groupId = data.conversationId;

      setUsers(prev => prev.filter(u => u._id !== groupId));
      if (selectedUser && selectedUser._id === groupId) {
        setMessages([]);
      }
      onGroupDeleted?.();
    };

    const handleGroupDeletionError = (error: { message: string; conversationId?: string }) => {
      console.error('Group deletion error:', error);
      onGroupDeletionError?.(error.message || 'Failed to delete group');
    };

    // Handle users added to group (multiple users)
    const handleUsersAddedToGroup = (data: {
      conversationId: string;
      groupName: string;
      groupAvatar: string | null;
      participants: string[];
      pendingParticipants?: string[];
      createdBy: string;
      invitedBy?: { _id: string; name: string };
      message?: string;
    }) => {
      console.log('Users added to group:', data);

      const allParticipants = data.participants || [];
      const pendingParticipants = data.pendingParticipants || [];

      // Checking if current user is in the participants or pendingParticipants list (newly added)
      const isCurrentUserAdded = allParticipants.includes(myUserId) || pendingParticipants.includes(myUserId);

      setUsers(prev => {
        // Check if group already exists in user's list
        const existingGroupIndex = prev.findIndex(user => user._id === data.conversationId && user.isGroup);

        if (existingGroupIndex !== -1) {
          // Group exists - update it
          return prev.map(user => {
            if (user._id === data.conversationId && user.isGroup) {
              const allUsers = [...allParticipants, ...pendingParticipants];

              // Update participants status based on new format
              const newParticipantsStatus = allUsers.reduce((acc: any, participant: string) => {
                // Users in participants array are 'joined', users in pendingParticipants are 'pending'
                acc[participant] = allParticipants.includes(participant) ? 'joined' : 'pending';
                return acc;
              }, {});

              return {
                ...user,
                participantsStatus: newParticipantsStatus,
                participants: allUsers
              };
            }
            return user;
          });
        } else if (isCurrentUserAdded) {
          const allUsers = [...allParticipants, ...pendingParticipants];

          const newGroup = {
            _id: data.conversationId,
            name: data.groupName,
            avatar: data.groupAvatar || undefined,
            participants: allUsers,
            participantsStatus: allUsers.reduce((acc: any, participant: string) => {
              // Users in participants array are 'joined', users in pendingParticipants are 'pending'
              acc[participant] = allParticipants.includes(participant) ? 'joined' : 'pending';
              return acc;
            }, {}),
            createdBy: data.createdBy,
            isGroup: true,
            lastMessage: null,
            lastMessageTimestamp: new Date().toISOString(),
            unreadCount: 0
          };

          console.log('Adding new group to current user:', newGroup);
          // Show notification that user was added to group
          if (pendingParticipants.includes(myUserId)) {
            toast.info(data.message || 'You have been invited to join the group.');
          } else {
            toast.info(MESSAGES.CHAT.ADDED_TO_GROUP);
          }
          return [...prev, newGroup];
        }
        return prev;
      });

      const adminUser = users.find(u => u._id === data.createdBy);
      const adminName = adminUser?.name || 'Admin';

      const currentParticipants = users.find(u => u._id === data.conversationId && u.isGroup)?.participants || [];
      const newlyAddedParticipants = data.participants.filter(p => !currentParticipants.includes(p));

      // Get names of newly added users
      const addedUserNames = newlyAddedParticipants.map(participantId => {
        const user = users.find(u => u._id === participantId);
        return user?.name || 'Unknown User';
      }).join(', ');

      const systemMessage: Message = {
        _id: `system_${Date.now()}`,
        id: `system_${Date.now()}`,
        content: addedUserNames
          ? `${adminName} added ${addedUserNames} to the group`
          : `${adminName} added new users to the group`,
        senderId: {
          _id: 'system',
          name: 'System'
        },
        timestamp: new Date().toISOString(),
        type: 'text'
      };

      if (selectedUser && selectedUser._id === data.conversationId) {
        setMessages(prev => [...prev, systemMessage]);
      }

      // If current user was added to the group, join the socket room
      if (isCurrentUserAdded) {
        console.log('Current user was added to group, joining socket room:', data.conversationId);
        // Join the group room
        if (typeof socket?.emit === 'function') {
          socket.emit('join_group', { groupId: data.conversationId });
        }
      }

      // Transforming data to match expected callback format
      onUsersAddedToGroup?.({
        addedUsers: addedUserNames
          ? addedUserNames.split(', ').map(name => ({ name }))
          : [{ name: 'users' }],
        addedBy: { name: adminName }
      });
    };

    // Handle add users to group error
    const handleAddUsersToGroupError = (error: { message: string; conversationId?: string }) => {
      console.error('Add users to group error:', error);
      onAddUsersError?.(error.message || 'Failed to add users to group');
    };

    // Handle user removed from group (updated to match backend response)
    const handleUserRemovedFromGroup = (data: {
      conversationId: string;
      groupName: string;
      groupAvatar: string | null;
      participants: string[];
      createdBy: string;
    }) => {
      console.log('User removed from group:', data);

      // Check if current user was removed (not in participants list anymore)
      const isCurrentUserRemoved = !data.participants.includes(myUserId);

      if (isCurrentUserRemoved) {
        // Current user was removed - remove group from their list
        setUsers(prev => prev.filter(user => user._id !== data.conversationId));
        if (selectedUser && selectedUser._id === data.conversationId) {
          setMessages([]);
        }
      } else {
        // Update the group with new participants list
        setUsers(prev => prev.map(user => {
          if (user._id === data.conversationId && user.isGroup) {
            // Find removed participants (compare with current participants)
            const currentParticipants = user.participants || [];
            const removedParticipants = currentParticipants.filter(p => !data.participants.includes(p));

            // Update participants status
            const newParticipantsStatus = { ...(user.participantsStatus || {}) };
            removedParticipants.forEach(participantId => {
              delete newParticipantsStatus[participantId];
            });

            return {
              ...user,
              participantsStatus: newParticipantsStatus,
              participants: data.participants
            };
          }
          return user;
        }));

        // Find the admin/remover name from users list
        const adminUser = users.find(u => u._id === data.createdBy);
        const adminName = adminUser?.name || 'Admin';

        // Find removed participants and their names
        const currentParticipants = users.find(u => u._id === data.conversationId && u.isGroup)?.participants || [];
        const removedParticipants = currentParticipants.filter(p => !data.participants.includes(p));

        // Get names of removed users
        const removedUserNames = removedParticipants.map(participantId => {
          const user = users.find(u => u._id === participantId);
          return user?.name || 'Unknown User';
        }).join(', ');

        // Add system message to show who was removed
        const systemMessage: Message = {
          _id: `system_${Date.now()}`,
          id: `system_${Date.now()}`,
          content: removedUserNames
            ? `${adminName} removed ${removedUserNames} from the group`
            : `${adminName} removed users from the group`,
          senderId: {
            _id: 'system',
            name: 'System'
          },
          timestamp: new Date().toISOString(),
          type: 'text'
        };

        if (selectedUser && selectedUser._id === data.conversationId) {
          setMessages(prev => [...prev, systemMessage]);
        }
        onUsersRemovedFromGroup?.({
          removedUsers: removedUserNames
            ? removedUserNames.split(', ').map(name => ({ name }))
            : [{ name: 'users' }],
          removedBy: { name: adminName }
        });
      }
    };

    // Handle remove users from group error
    const handleRemoveUsersFromGroupError = (error: { message: string; conversationId?: string }) => {
      console.error('Remove users from group error:', error);
      onRemoveUsersError?.(error.message || 'Failed to remove users from group');
    };

    // Add handler for when a user joins a group
    const handleUserJoinedGroup = (data: { groupId: string; userId: string }) => {
      setUsers(prev => prev.map(user => {
        if (user._id === data.groupId && user.isGroup) {
          return {
            ...user,
            participantsStatus: {
              ...user.participantsStatus,
              [data.userId]: 'joined'
            }
          };
        }
        return user;
      }));
    };

    // Add handler for when a user leaves a group
    const handleUserLeftGroup = (data: { groupId: string; userId: string }) => {
      console.log(data, "Received user_left_group event in useChatSocketHandlers");
      setUsers(prev => prev.map(user => {
        if (user._id === data.groupId && user.isGroup) {
          const newParticipantsStatus = { ...(user.participantsStatus || {}) };
          delete newParticipantsStatus[data.userId];
          return {
            ...user,
            participantsStatus: newParticipantsStatus
          };
        }
        return user;
      }));

      // If the current user left the group, remove it from their list
      if (data.userId === myUserId) {
        setUsers(prev => prev.filter(user => user._id !== data.groupId));
        if (selectedUser && selectedUser._id === data.groupId) {
          setMessages([]);
        }
      }
    };

    // Add handler for leave group response (when user successfully leaves)
    const handleLeaveGroupResponse = (data: {
      conversationId: string;
      message: string;
      participants: string[];
      groupName: string;
      createdBy: string;
      groupAvatar: string | null;
    }) => {
      console.log(data, "Received leave group response in useChatSocketHandlers");

      // Remove the group from user's list since they left
      setUsers(prev => prev.filter(user => user._id !== data.conversationId));

      // Clear messages if this was the selected conversation
      if (selectedUser && selectedUser._id === data.conversationId) {
        setMessages([]);
        // Notify parent component to select first available user
        onUserLeftGroup?.();
      }

      // Show success message
      toast.success(data.message || 'You left the group successfully');
    };

    socket.on('group_created', handleGroupCreated);
    socket.on('group_updated', handleGroupUpdated);
    socket.on('group_deleted', handleGroupDeleted);
    socket.on('group_deletion_error', handleGroupDeletionError);
    socket.on('user_joined_group', handleUserJoinedGroup);
    socket.on('user_left_group', handleUserLeftGroup);
    socket.on('leave_group_response', handleLeaveGroupResponse);
    socket.on('users_added_to_group', handleUsersAddedToGroup);
    socket.on('add_users_to_group_error', handleAddUsersToGroupError);
    socket.on('user_removed_from_group', handleUserRemovedFromGroup);
    socket.on('remove_users_from_group_error', handleRemoveUsersFromGroupError);

    return () => {
      socket.off('group_created', handleGroupCreated);
      socket.off('group_updated', handleGroupUpdated);
      socket.off('group_deleted', handleGroupDeleted);
      socket.off('group_deletion_error', handleGroupDeletionError);
      socket.off('user_joined_group', handleUserJoinedGroup);
      socket.off('user_left_group', handleUserLeftGroup);
      socket.off('leave_group_response', handleLeaveGroupResponse);
      socket.off('users_added_to_group', handleUsersAddedToGroup);
      socket.off('add_users_to_group_error', handleAddUsersToGroupError);
      socket.off('user_removed_from_group', handleUserRemovedFromGroup);
      socket.off('remove_users_from_group_error', handleRemoveUsersFromGroupError);
    };
  }, [socket, setUsers, setMessages, selectedUser, myUserId]);

  // Listen for last_message_updated event from backend
  useEffect(() => {
    if (!socket || !myUserId) return;

    const handleLastMessageUpdated = (data: {
      conversationId: string;
      lastMessage: {
        content: string;
        senderId: string;
        timestamp: string;
        type: string;
      };
    }) => {
      console.log(data, "Received last_message_updated event in useChatSocketHandlers");
      setUsers(prev => prev.map(user => {
        if (user._id === data.conversationId) {
          return {
            ...user,
            lastMessage: {
              content: data.lastMessage.content,
              senderId: data.lastMessage.senderId,
              timestamp: data.lastMessage.timestamp,
              type: data.lastMessage.type,
            },
            lastMessageTimestamp: data.lastMessage.timestamp,
          };
        }
        return user;
      }));
    };

    socket.on('last_message_updated', handleLastMessageUpdated);
    return () => {
      socket.off('last_message_updated', handleLastMessageUpdated);
    };
  }, [socket, setUsers, myUserId]);

  // Listen for message_edited event from backend
  useEffect(() => {
    if (!socket) return;
    const handleMessageEdited = (updatedMessage: any) => {
      console.log('Received message_edited event:', updatedMessage);
      setMessages(prevMsgs => prevMsgs.map(msg =>
        (msg._id === updatedMessage._id || msg._id === updatedMessage.messageId) ? {
          ...msg,
          content: updatedMessage.content || updatedMessage.newContent,
          edited: true,
          editedAt: updatedMessage.editedAt || new Date().toISOString()
        } : msg
      ));

      // Show success toast when message is edited
      toast.success(MESSAGES.CHAT.MESSAGE_EDITED_SUCCESS);
    };

    const handleEditErrorMessage = (error: any) => {
      console.error('Received edit_error_message event:', error);
      toast.error(error.message || error.error || MESSAGES.CHAT.MESSAGE_EDIT_FAILED);
    };

    socket.on('message_edited', handleMessageEdited);
    socket.on('edit_error_message', handleEditErrorMessage);
    return () => {
      socket.off('message_edited', handleMessageEdited);
      socket.off('edit_error_message', handleEditErrorMessage);
    };
  }, [socket, setMessages]);


  useEffect(() => {
    if (!socket) return;

    const handleMessagePinned = (data: { messageId: string; status: boolean; pinnedAt: string; userId: string; message?: Message }) => {
      console.log('PINNED EVENT - Received message_pinned event:', data);

      if (data.status) {
        // Update messages state
        setMessages(prev => {
          const updatedMessages = prev.map(msg =>
            msg._id === data.messageId ? { ...msg, isPinned: true } : msg
          );
          const updatedMessage = updatedMessages.find(m => m._id === data.messageId);
          console.log('PINNED EVENT - Updated message:', updatedMessage);

          // Find the message to add to pinned list
          if (updatedMessage) {
            setPinnedMessages(prevPinned => {
              const alreadyPinned = prevPinned.some(m => m._id === data.messageId);
              console.log('PINNED EVENT - Already pinned?', alreadyPinned);

              if (!alreadyPinned) {
                const newPinnedList = [...prevPinned, { ...updatedMessage, isPinned: true }];
                console.log('PINNED EVENT - New pinned list:', newPinnedList);
                return newPinnedList;
              }
              return prevPinned;
            });
          }

          return updatedMessages;
        });

        // Show success toast
        console.log('PINNED EVENT - Showing success toast');
        toast.success(MESSAGES.CHAT.MESSAGE_PINNED_SUCCESS);
      }
    };

    const handleMessageUnpinned = (data: { messageId: string; status: boolean; userId: string }) => {
      console.log('UNPINNED EVENT - Received message_unpinned event:', data);

      if (data.status) {
        setMessages(prev => {
          const updatedMessages = prev.map(msg =>
            msg._id === data.messageId ? { ...msg, isPinned: false, pinnedAt: undefined } : msg
          );
          const updatedMessage = updatedMessages.find(m => m._id === data.messageId);
          console.log('UNPINNED EVENT - Updated message:', updatedMessage);
          return updatedMessages;
        });

        setPinnedMessages(prev => {
          const filteredList = prev.filter(msg => msg._id !== data.messageId);
          console.log('UNPINNED EVENT - Filtered pinned list:', filteredList);
          return filteredList;
        });

        // Show success toast
        console.log('UNPINNED EVENT - Showing success toast');
        toast.success(MESSAGES.CHAT.MESSAGE_UNPINNED_SUCCESS);
      }
    };

    socket.on('message_pinned', handleMessagePinned);
    socket.on('message_unpinned', handleMessageUnpinned);

    return () => {
      socket.off('message_pinned', handleMessagePinned);
      socket.off('message_unpinned', handleMessageUnpinned);
    };
  }, [socket, setMessages, setPinnedMessages]);

}
