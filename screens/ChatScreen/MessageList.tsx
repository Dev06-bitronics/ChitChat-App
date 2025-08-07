import React, { useRef, useEffect, useState } from 'react';
import { Message, User } from './ChatScreen.types';
//@ts-ignore
import styles from './ChatScreen.module.css';
import MediaEmbed from '@/components/MediaEmbed/MediaEmbed';
import { BsCheck } from 'react-icons/bs';
import { RiCheckDoubleLine } from 'react-icons/ri';
import { BsThreeDotsVertical } from 'react-icons/bs';
import NoDataFound from '@/components/NoDataFound/NoDataFound';
import MessageContextMenu from '@/components/MessageContextMenu/MessageContextMenu';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';
import { formatTo12Hour, generateInitials, isSameMinute } from '@/utils/helperFunctions';
import { MESSAGES, UI } from '@/constants';

interface MessageListProps {
  messages: Message[];
  myUserId: string;
  selectedUser: User | null;
  onReact: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string) => void;
  emojiBarOpenId: string | null;
  setEmojiBarOpenId: (id: string | null) => void;
  reactionRemoveOpenId: string | null;
  setReactionRemoveOpenId: (id: string | null) => void;
  setImageModal: (modal: { open: boolean; url: string; name?: string }) => void;
  openYouTubePlayers: { [msgId: string]: boolean };
  setOpenYouTubePlayers: React.Dispatch<React.SetStateAction<{ [msgId: string]: boolean }>>;
  typingUsers?: { [userId: string]: boolean };
  showScrollToBottom?: boolean;
  chatEndRef?: React.RefObject<HTMLDivElement>;
  onScrollToBottom?: () => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onThreadReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  pinnedMessages: Message[];
  onPin: (message: Message) => void;
  onJoinGroup?: (groupId: string) => void;
  users?: User[];
}

const emojiOptions = ['👍', '😂', '❤️', '😮', '😢', '🎉'];

const MessageList: React.FC<MessageListProps> = ({
  messages,
  myUserId,
  selectedUser,
  onReact,
  onRemoveReaction,
  emojiBarOpenId,
  setEmojiBarOpenId,
  reactionRemoveOpenId,
  setReactionRemoveOpenId,
  setImageModal,
  openYouTubePlayers,
  setOpenYouTubePlayers,
  typingUsers = {},
  showScrollToBottom = false,
  chatEndRef,
  onScrollToBottom,
  onDelete,
  onReply,
  onThreadReply,
  onEdit,
  pinnedMessages,
  onPin,
  onJoinGroup,
  users = [],
}) => {
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    messageId: string;
  }>({
    open: false,
    x: 0,
    y: 0,
    messageId: '',
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    messageId: string;
    messageContent: string;
  }>({
    open: false,
    messageId: '',
    messageContent: '',
  });
  useEffect(() => {
    if (!emojiBarOpenId) return;
    const handleClick = (e: MouseEvent) => {
      const selector = document.getElementById('emoji-selector-bar');
      if (selector && !selector.contains(e.target as Node)) {
        setEmojiBarOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [emojiBarOpenId, setEmojiBarOpenId]);

  useEffect(() => {
    if (!contextMenu.open) return;
    const handleClick = (e: MouseEvent) => {
      // Don't close if clicking on the context menu itself
      const contextMenuElement = document.querySelector('[data-context-menu]');
      if (contextMenuElement && contextMenuElement.contains(e.target as Node)) {
        return;
      }
      setContextMenu(prev => ({ ...prev, open: false }));
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu.open]);

  const handleMessageMenuClick = (e: React.MouseEvent, messageId: string, isMine: boolean) => {
    console.log('handleMessageMenuClick called with:', { messageId, isMine });
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const padding = 10;

    let x: number;

    if (isMine) {
      // For my messages, position menu to the right of the button (will be transformed left by the menu)
      x = rect.right + padding;
    } else {
      // For other messages, position menu to the right of the button
      x = rect.right + padding;
    }

    // Ensure menu doesn't go off-screen
    const viewportWidth = window.innerWidth;
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    const y = rect.top;

    console.log('Setting context menu with:', { open: true, x, y, messageId });
    setContextMenu({
      open: true,
      x,
      y,
      messageId,
    });
  };

  const handleContextMenuAction = (action: string) => {
    console.log(`${action} for message: ${contextMenu.messageId}`);

    if (action === 'delete') {
      const message = messages.find(m => m._id === contextMenu.messageId);
      setDeleteConfirmation({
        open: true,
        messageId: contextMenu.messageId,
        messageContent: message?.content || MESSAGES.CHAT.THIS_MESSAGE,
      });
    } else if (action === 'reply' && onReply) {
      onReply(contextMenu.messageId);
    } else if (action === 'threadReply' && onThreadReply) {
      onThreadReply(contextMenu.messageId);
    } else if (action === 'edit' && onEdit) {
      onEdit(contextMenu.messageId);
    } else if (action === 'pin') {
      const message = messages.find(m => m._id === contextMenu.messageId);
      if (message && onPin) {
        onPin(message);
      }
    }

    setContextMenu(prev => ({ ...prev, open: false }));
  };

  const isMessagePinned = (messageId: string): boolean => {
    const message = messages.find(m => m._id === messageId);
    return message?.isPinned ?? false;
  };

  const isPendingGroup = selectedUser?.isGroup &&
    selectedUser.participantsStatus?.[myUserId] === 'pending';

  console.log('Group status check:', {
    isGroup: selectedUser?.isGroup,
    myUserId,
    participantsStatus: selectedUser?.participantsStatus,
    myStatus: selectedUser?.participantsStatus?.[myUserId],
    isPendingGroup,
    createdBy: selectedUser?.createdBy
  });

  if (isPendingGroup) {
    const creator = users.find(u => u._id === selectedUser.createdBy);
    return (
      <div className={styles.groupJoinContainer}>
        <div className={styles.groupJoinInfo}>
          <h3>{selectedUser.name}</h3>
          <p>{MESSAGES.CHAT.CREATED_BY} {creator?.name || MESSAGES.CHAT.UNKNOWN_USER}</p>
          <p>{selectedUser.participants?.length || 0} {MESSAGES.CHAT.MEMBERS}</p>
          <button
            className={styles.joinGroupButton}
            onClick={() => onJoinGroup?.(selectedUser._id)}
          >
            {MESSAGES.CHAT.JOIN_GROUP}
          </button>
        </div>
      </div>
    );
  }

  if (!messages.length) {
    return <NoDataFound message={MESSAGES.CHAT.NO_CHATS_YET} />;
  }

  console.log('Rendering MessageContextMenu with:', contextMenu);

  // Filter pinned messages for current conversation only
  const seenMessageIds = new Set<string>();
  const currentConversationPinnedMessages = selectedUser ? messages.filter(msg => {
    if (!msg.isPinned) {
      return false;
    }

    const isCurrentConversation =
      (msg.senderId?._id === myUserId && msg.receiverId?._id === selectedUser._id) ||
      (msg.senderId?._id === selectedUser._id && msg.receiverId?._id === myUserId);

    if (!isCurrentConversation) {
      return false;
    }

    // Check for duplicates using both id and _id
    const messageId = msg._id || msg._id;
    if (seenMessageIds.has(messageId)) {
      return false;
    }

    seenMessageIds.add(messageId);

    console.log('Processing pinned message:', {
      messageId,
      senderId: msg.senderId?._id,
      receiverId: msg.receiverId?._id,
      isPinned: msg.isPinned
    });

    return true;
  }) : [];

  const handleConfirmDelete = () => {
    if (onDelete) {
      console.log('Calling onDelete with messageId:', deleteConfirmation.messageId);
      onDelete(deleteConfirmation.messageId);
    }
    setDeleteConfirmation({ open: false, messageId: '', messageContent: '' });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ open: false, messageId: '', messageContent: '' });
  };

  console.log(selectedUser?._id, "selectedUser?._id------------------->");

  return (
    <div>
      {messages && messages.map((msg, index) => {
        // Check if message belongs to current conversation
        console.log(msg?.senderId?._id, myUserId, "msg.status------------------->");
        const isCurrentConversation =
          (msg.senderId?._id === myUserId && msg.receiverId?._id === selectedUser?._id) ||
          (msg.senderId?._id === selectedUser?._id && msg.receiverId?._id === myUserId);

        if (!isCurrentConversation) {
          return null;
        }

        const isMine = msg?.senderId?._id === myUserId;
        const allLines = (msg?.content || '').split('\n').map(line => line.trim());
        const supportedLinks = allLines.filter(line => /https?:\/\//.test(line));
        const mediaLink = supportedLinks[0];
        const textBelow = allLines.filter(line => !supportedLinks.includes(line) && line !== '').join(' ').replace(/\s+/g, ' ').trim();
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];
        const isFirstInGroup = !prevMsg || prevMsg.senderId?._id !== msg.senderId?._id;
        const isLastInGroup = !nextMsg || nextMsg.senderId?._id !== msg.senderId?._id || !isSameMinute(nextMsg, msg);

        // Render all unique emojis from reactions object or array
        let allReactions: string[] = [];
        if (Array.isArray(msg.reactions)) {
          allReactions = msg.reactions.map((r: any) => r.reaction);
        } else if (msg.reactions && typeof msg.reactions === 'object') {
          allReactions = Object.values(msg.reactions).filter(val => typeof val === 'string');
        }
        const uniqueReactions = Array.from(new Set(allReactions));

        // Avatar logic
        const avatar = !isMine ? selectedUser?.avatar : undefined;
        const initials = !isMine && selectedUser ? selectedUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '';

        // Render replied message bubble if this message is a reply
        let repliedMessage: any = undefined;
        if (msg.replyToMessageId) {
          if (typeof msg.replyToMessageId === 'object' && 'content' in msg.replyToMessageId) {
            repliedMessage = msg.replyToMessageId;
          } else if (typeof msg.replyToMessageId === 'string') {
            repliedMessage = messages.find(m => m._id === msg.replyToMessageId || m._id === msg.replyToMessageId);
          }
        }

        const bubbleStyle = {
          marginTop: isFirstInGroup ? 6 : 1,
          marginBottom: isLastInGroup ? 8 : 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column' as const,
        };

        const isPinned = isMessagePinned(msg._id || msg._id);

        if (isMine) {
          return (
            <div
              key={msg._id}
              className={styles.chatMsgRowMine}
              style={{
                alignItems: 'flex-end',
                ...bubbleStyle,
              }}
            >
              {uniqueReactions.length > 0 && (
                <div className={styles.reactionsBar} style={{ marginBottom: 2 }}>
                  {uniqueReactions.map((emoji, i) => (
                    <span key={i} className={styles.reactionItem}>{emoji}</span>
                  ))}
                </div>
              )}
              <div style={{ position: 'relative', width: 'fit-content', maxWidth: 340 }}>
                {/* Three dots menu button - positioned to the left for my messages */}
                <button
                  className={`${styles.messageMenuBtn} ${contextMenu.open && contextMenu.messageId === msg._id ? styles.active : ''}`}
                  style={{
                    left: '-40px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                  onClick={(e) => handleMessageMenuClick(e, msg._id, true)}
                  title={UI.MESSAGE.MESSAGE_OPTIONS}
                >
                  <BsThreeDotsVertical size={16} />
                </button>

                {emojiBarOpenId === msg._id && (
                  <div
                    id="emoji-selector-bar"
                    className={styles.emojiSelectorBar}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bottom: '100%',
                      marginBottom: 8,
                      zIndex: 99999,
                      background: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      padding: '4px 8px',
                      display: 'flex',
                      gap: 6,
                    }}
                  >
                    {emojiOptions.map(emoji => {
                      const hasReacted = Array.isArray(msg.reactions)
                        ? msg.reactions.some((r: any) => r.reaction === emoji && r.userId === myUserId)
                        : msg.reactions && typeof msg.reactions === 'object'
                          ? Object.entries(msg.reactions).some(([uid, r]) => r === emoji && uid === myUserId)
                          : false;
                      return (
                        <span
                          key={emoji}
                          className={styles.emojiSelectorEmoji}
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (hasReacted) {
                              onRemoveReaction(msg?._id);
                            } else {
                              onReact(msg?._id, emoji);
                            }
                            setEmojiBarOpenId(null);
                          }}
                          style={{ fontSize: 22, cursor: 'pointer', padding: 2, opacity: hasReacted ? 0.5 : 1 }}
                        >
                          {emoji}
                        </span>
                      );
                    })}
                  </div>
                )}                {repliedMessage && (
                  <div className={styles.repliedMessageBubble} style={{ background: '#f5f5f7', borderRadius: 8, padding: '6px 10px', marginBottom: 0, maxWidth: '100%' }}>
                    <div style={{ fontSize: 13, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {repliedMessage.content}
                    </div>
                  </div>
                )}
                <div
                  className={`${styles.myMsg} ${isPinned ? styles.pinned : ''}`}
                  id={`message-${msg._id || msg._id}`}
                  style={{
                    maxWidth: 340,
                    wordBreak: 'break-word',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    console.log('open emoji bar', msg._id);
                    setEmojiBarOpenId(msg._id);
                  }}
                >
                  {/* {isPinned && (
                    <div className={styles.pinnedIndicator}>📌</div>
                  )} */}
                  <div className={styles.chatMsgContent}>
                    {mediaLink && (
                      <MediaEmbed
                        content={mediaLink}
                        openYouTube={openYouTubePlayers[msg?._id]}
                        setOpenYouTube={open => setOpenYouTubePlayers(prev => ({ ...prev, [msg?._id]: open }))}
                      />
                    )}
                    {textBelow && (
                      <div className={styles.chatMsgTextBelow}>
                        {textBelow} {msg.edited && <span style={{ color: '#888', fontSize: 12, marginLeft: 4 }}>{MESSAGES.CHAT.EDITED}</span>}
                      </div>
                    )}
                    {mediaLink && (
                      <div className={styles.chatMsgTextBelow}>{mediaLink}</div>
                    )}
                    {(msg.type === 'image' && msg.fileUrl) && (
                      <div className={styles.chatMsgMediaWrapper}>
                        <img
                          src={msg?.fileUrl}
                          alt={msg?.fileName || MESSAGES.CHAT.SENT_IMAGE}
                          className={styles.chatImageThumb}
                          style={{ cursor: 'pointer', maxWidth: 180, maxHeight: 180, borderRadius: 8, boxShadow: '0 2px 8px #0002' }}
                          onClick={() => setImageModal({ open: true, url: msg?.fileUrl!, name: msg?.fileName })}
                        />
                      </div>
                    )}
                    {(msg.type === 'audio' && msg.fileUrl) && (
                      <div className={styles.chatMsgMediaWrapper}>
                        <audio controls className={styles.chatAudioPlayer}>
                          <source src={msg?.fileUrl} type={msg?.fileType || 'audio/mpeg'} />
                          {MESSAGES.CHAT.AUDIO_NOT_SUPPORTED}
                        </audio>
                        <div className={styles.fileMeta}>{msg?.fileName} {msg?.fileSize ? `(${(msg?.fileSize / 1024 / 1024).toFixed(2)} MB)` : ''}</div>
                      </div>
                    )}
                    {(msg.type === 'video' && msg.fileUrl) && (
                      <div className={styles.chatMsgMediaWrapper}>
                        <video controls className={styles.chatVideoPlayer}>
                          <source src={msg?.fileUrl} type={msg?.fileType || 'video/mp4'} />
                          {MESSAGES.CHAT.VIDEO_NOT_SUPPORTED}
                        </video>
                        <div className={styles.fileMeta}>{msg?.fileName} {msg?.fileSize ? `(${(msg?.fileSize / 1024 / 1024).toFixed(2)} MB)` : ''}</div>
                      </div>
                    )}
                    {(msg?.type === 'file' && msg?.fileUrl) && (
                      <div className={styles.chatMsgMediaWrapper}>
                        <a href={msg?.fileUrl} download={msg?.fileName} className={styles.fileLink} target="_blank" rel="noopener noreferrer">
                          📎 {msg?.fileName || msg?.content}
                        </a>
                        <div className={styles.fileMeta}>{msg?.fileSize ? `${(msg?.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}</div>
                      </div>
                    )}
                    {msg?.type === 'emoji' && <span className={styles.chatMsgEmoji}>{msg?.content}</span>}
                  </div>
                </div>
                {isLastInGroup && (
                  <div
                    className={styles.timestampRow}
                    style={{ justifyContent: isMine ? 'flex-end' : 'flex-start', display: 'flex', alignItems: 'center', gap: 1, marginTop: 5, marginRight: isMine ? 1 : 0, marginLeft: isMine ? 0 : 1, fontSize: '0.75rem', color: 'var(--color-textSecondary)', minHeight: 20, maxWidth: 340 }}
                  >
                    {isMine && (
                      msg?.status === 'sent' ? (
                        <BsCheck style={{ color: '#888', fontSize: 16, marginRight: 4 }} />
                      ) : msg?.status === 'delivered' ? (
                        <RiCheckDoubleLine style={{ color: '#888', fontSize: 16, marginRight: 4 }} />
                      ) : msg?.status === 'seen' ? (
                        <RiCheckDoubleLine style={{ color: '#1976d2', fontSize: 16, marginRight: 4 }} />
                      ) : null
                    )}
                    {formatTo12Hour(msg?.timestamp || msg?.createdAt || msg?.updatedAt)}
                  </div>
                )}
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={msg._id}
              className={styles.chatMsgRowOther}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                marginTop: isFirstInGroup ? 0 : 1,
                marginBottom: isLastInGroup ? 0 : 1,
                position: 'relative',
              }}
            >
              {isLastInGroup ? (
                <div style={{
                  marginRight: 8,
                  alignSelf: 'flex-end',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  paddingBottom: 25,
                }}>
                  {avatar ? (
                    <img src={avatar} alt={selectedUser?.name} className={styles.avatar} style={{ width: 32, height: 32 }} />
                  ) : (
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--color-primaryGradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-bubbleSelfText)',
                      fontWeight: 600,
                      fontSize: '1rem',
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                    }}>{initials}</div>
                  )}
                </div>
              ) : (
                <div style={{ width: 32, marginRight: 8 }} />
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative' }}>
                {uniqueReactions.length > 0 && (
                  <div className={styles.reactionsBar} style={{ marginBottom: 2 }}>
                    {uniqueReactions.map((emoji, i) => (
                      <span key={i} className={styles.reactionItem}>{emoji}</span>
                    ))}
                  </div>
                )}
                {/* For both myMsg and otherMsg, wrap the message bubble and emoji bar in a relative container: */}
                <div style={{ position: 'relative', width: 'fit-content', maxWidth: 340 }}>
                  {/* Three dots menu button - positioned to the right for other messages */}
                  <button
                    className={`${styles.messageMenuBtn} ${contextMenu.open && contextMenu.messageId === msg._id ? styles.active : ''}`}
                    style={{
                      right: '-40px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                    onClick={(e) => handleMessageMenuClick(e, msg._id, false)}
                    title={UI.MESSAGE.MESSAGE_OPTIONS}
                  >
                    <BsThreeDotsVertical size={16} />
                  </button>

                  {emojiBarOpenId === msg._id && (
                    <div
                      id="emoji-selector-bar"
                      className={styles.emojiSelectorBar}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bottom: '100%',
                        marginBottom: 8,
                        zIndex: 99999,
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        padding: '4px 8px',
                        display: 'flex',
                        gap: 6,
                      }}
                    >
                      {emojiOptions.map(emoji => {
                        const hasReacted = Array.isArray(msg.reactions)
                          ? msg.reactions.some((r: any) => r.reaction === emoji && r.userId === myUserId)
                          : msg.reactions && typeof msg.reactions === 'object'
                            ? Object.entries(msg.reactions).some(([uid, r]) => r === emoji && uid === myUserId)
                            : false;
                        return (
                          <span
                            key={emoji}
                            className={styles.emojiSelectorEmoji}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (hasReacted) {
                                onRemoveReaction(msg?._id);
                              } else {
                                onReact(msg?._id, emoji);
                              }
                              setEmojiBarOpenId(null);
                            }}
                            style={{ fontSize: 22, cursor: 'pointer', padding: 2, opacity: hasReacted ? 0.5 : 1 }}
                          >
                            {emoji}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {repliedMessage && (
                    <div className={styles.repliedMessageBubble} style={{ background: '#f5f5f7', borderRadius: 8, padding: '6px 10px', marginBottom: 0, maxWidth: '100%' }}>
                      <div style={{ fontSize: 13, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {repliedMessage.content}
                      </div>
                    </div>
                  )}
                  <div
                    className={`${styles.otherMsg} ${isPinned ? styles.pinned : ''}`}
                    id={`message-${msg._id || msg._id}`}
                    style={{
                      maxWidth: 340,
                      wordBreak: 'break-word',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      setEmojiBarOpenId(msg._id);
                    }}
                  >
                    {/* {isPinned && (
                      <div className={styles.pinnedIndicator}>📌</div>
                    )} */}
                    <div className={styles.chatMsgContent}>
                      {mediaLink && (
                        <MediaEmbed
                          content={mediaLink}
                          openYouTube={openYouTubePlayers[msg?._id]}
                          setOpenYouTube={open => setOpenYouTubePlayers(prev => ({ ...prev, [msg?._id]: open }))}
                        />
                      )}
                      {textBelow && (
                        <div className={styles.chatMsgTextBelow}>
                          {textBelow} {msg.edited && <span style={{ color: '#888', fontSize: 12, marginLeft: 4 }}>{MESSAGES.CHAT.EDITED}</span>}
                        </div>
                      )}
                      {mediaLink && (
                        <div className={styles.chatMsgTextBelow}>{mediaLink}</div>
                      )}
                      {(msg.type === 'image' && msg.fileUrl) && (
                        <div className={styles.chatMsgMediaWrapper}>
                          <img
                            src={msg?.fileUrl}
                            alt={msg?.fileName || MESSAGES.CHAT.SENT_IMAGE}
                            className={styles.chatImageThumb}
                            style={{ cursor: 'pointer', maxWidth: 180, maxHeight: 180, borderRadius: 8, boxShadow: '0 2px 8px #0002' }}
                            onClick={() => setImageModal({ open: true, url: msg?.fileUrl!, name: msg?.fileName })}
                          />
                        </div>
                      )}
                      {(msg.type === 'audio' && msg.fileUrl) && (
                        <div className={styles.chatMsgMediaWrapper}>
                          <audio controls className={styles.chatAudioPlayer}>
                            <source src={msg?.fileUrl} type={msg?.fileType || 'audio/mpeg'} />
                            {MESSAGES.CHAT.AUDIO_NOT_SUPPORTED}
                          </audio>
                          <div className={styles.fileMeta}>{msg?.fileName} {msg?.fileSize ? `(${(msg?.fileSize / 1024 / 1024).toFixed(2)} MB)` : ''}</div>
                        </div>
                      )}
                      {(msg.type === 'video' && msg.fileUrl) && (
                        <div className={styles.chatMsgMediaWrapper}>
                          <video controls className={styles.chatVideoPlayer}>
                            <source src={msg?.fileUrl} type={msg?.fileType || 'video/mp4'} />
                            {MESSAGES.CHAT.VIDEO_NOT_SUPPORTED}
                          </video>
                          <div className={styles.fileMeta}>{msg?.fileName} {msg?.fileSize ? `(${(msg?.fileSize / 1024 / 1024).toFixed(2)} MB)` : ''}</div>
                        </div>
                      )}
                      {(msg?.type === 'file' && msg?.fileUrl) && (
                        <div className={styles.chatMsgMediaWrapper}>
                          <a href={msg?.fileUrl} download={msg?.fileName} className={styles.fileLink} target="_blank" rel="noopener noreferrer">
                            📎 {msg?.fileName || msg?.content}
                          </a>
                          <div className={styles.fileMeta}>{msg?.fileSize ? `${(msg?.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}</div>
                        </div>
                      )}
                      {msg?.type === 'emoji' && <span className={styles.chatMsgEmoji}>{msg?.content}</span>}
                    </div>
                  </div>
                  {isLastInGroup && (
                    <div
                      className={styles.timestampRow}
                      style={{ justifyContent: isMine ? 'flex-end' : 'flex-start', display: 'flex', alignItems: 'center', gap: 1, marginTop: 5, marginRight: isMine ? 1 : 0, marginLeft: isMine ? 0 : 1, fontSize: '0.75rem', color: 'var(--color-textSecondary)', minHeight: 20, maxWidth: 340 }}
                    >
                      {isMine && (
                        msg?.status === 'sent' ? (
                          <BsCheck style={{ color: '#888', fontSize: 16, marginRight: 4 }} />
                        ) : msg?.status === 'delivered' ? (
                          <RiCheckDoubleLine style={{ color: '#888', fontSize: 16, marginRight: 4 }} />
                        ) : msg?.status === 'seen' ? (
                          <RiCheckDoubleLine style={{ color: '#1976d2', fontSize: 16, marginRight: 4 }} />
                        ) : null
                      )}
                      {formatTo12Hour(msg?.timestamp || msg?.createdAt || msg?.updatedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }
      })}
      <div ref={chatEndRef} />
      {selectedUser && typingUsers[selectedUser._id] && (
        <div className={styles.typingIndicator}>{selectedUser.name} is typing...</div>
      )}

      <MessageContextMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        isOwnMessage={messages.find(m => m._id === contextMenu.messageId)?.senderId?._id === myUserId}
        isPinned={!!messages.find(m =>
          (m._id === contextMenu.messageId || m._id === contextMenu.messageId) && m.isPinned === true
        )}
        onClose={() => setContextMenu(prev => ({ ...prev, open: false }))}
        onReply={() => handleContextMenuAction('reply')}
        onThreadReply={() => handleContextMenuAction('threadReply')}
        onPin={() => handleContextMenuAction('pin')}
        onEdit={() => handleContextMenuAction('edit')}
        onDelete={() => handleContextMenuAction('delete')}
      />

      <ConfirmationModal
        open={deleteConfirmation.open}
        title={MESSAGES.CHAT.DELETE_MESSAGE_TITLE}
        message={MESSAGES.CHAT.DELETE_MESSAGE_CONFIRM}
        confirmText={UI.BUTTONS.DELETE}
        cancelText={UI.BUTTONS.CANCEL}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default MessageList; 