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

  // Close emoji bar on outside click
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

  // Close context menu on outside click
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
    const menuWidth = 200; // Approximate width of the context menu
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
    console.log('onDelete function available:', !!onDelete);
    
    if (action === 'delete') {
      const message = messages.find(m => m.id === contextMenu.messageId);
      setDeleteConfirmation({
        open: true,
        messageId: contextMenu.messageId,
        messageContent: message?.content || 'this message',
      });
    } else if (action === 'reply' && onReply) {
      onReply(contextMenu.messageId);
    } else if (action === 'threadReply' && onThreadReply) {
      onThreadReply(contextMenu.messageId);
    } else if (action === 'edit' && onEdit) {
      onEdit(contextMenu.messageId);
    }
    
    setContextMenu(prev => ({ ...prev, open: false }));
  };

  if (!messages.length) {
    return <NoDataFound message="No chats here yet..." />;
  }

  console.log('Rendering MessageContextMenu with:', contextMenu);

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

  return (
    <div>
      {messages && messages.map((msg, index) => {
        const isMine = msg?.senderId === myUserId;
        const allLines = (msg?.content || '').split('\n').map(line => line.trim());
        const supportedLinks = allLines.filter(line => /https?:\/\//.test(line));
        const mediaLink = supportedLinks[0];
        const textBelow = allLines.filter(line => !supportedLinks.includes(line) && line !== '').join(' ').replace(/\s+/g, ' ').trim();
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];
        const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
        const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId || !isSameMinute(nextMsg, msg);

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
            repliedMessage = messages.find(m => m.id === msg.replyToMessageId || m._id === msg.replyToMessageId);
          }
        }

        const bubbleStyle = {
          marginTop: isFirstInGroup ? 6 : 1,
          marginBottom: isLastInGroup ? 8 : 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        };

        if (isMine) {
          return (
            <div
              key={msg.id}
              className={styles.chatMsgRowMine}
              style={{
                alignItems: 'flex-end',
                ...bubbleStyle,
              }}
            >
              
              {/* My message content (no avatar) */}
              {/* Reactions bar above the message bubble */}
              {uniqueReactions.length > 0 && (
                <div className={styles.reactionsBar} style={{ marginBottom: 2 }}>
                  {uniqueReactions.map((emoji, i) => (
                    <span key={i} className={styles.reactionItem}>{emoji}</span>
                  ))}
                </div>
              )}
              {/* For both myMsg and otherMsg, wrap the message bubble and emoji bar in a relative container: */}
              <div style={{ position: 'relative', width: 'fit-content', maxWidth: 340 }}>
                {/* Three dots menu button - positioned to the left for my messages */}
                <button
                  className={`${styles.messageMenuBtn} ${contextMenu.open && contextMenu.messageId === msg.id ? styles.active : ''}`}
                  style={{
                    left: '-40px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                  onClick={(e) => handleMessageMenuClick(e, msg.id, true)}
                  title="Message options"
                >
                  <BsThreeDotsVertical size={16} />
                </button>

                {emojiBarOpenId === msg.id && (
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
                              onRemoveReaction(msg?.id);
                            } else {
                              onReact(msg?.id, emoji);
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
                {/* Replied message bubble INSIDE the blue bubble, no border, no margin */}
                {repliedMessage && (
                  <div className={styles.repliedMessageBubble} style={{ background: '#f5f5f7', borderRadius: 8, padding: '6px 10px', marginBottom: 0, maxWidth: '100%' }}>
                    <div style={{ fontSize: 13, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {repliedMessage.content}
                    </div>
                  </div>
                )}
                <div
                  className={styles.myMsg}
                  style={{
                    maxWidth: 340,
                    wordBreak: 'break-word',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    console.log('open emoji bar', msg.id);
                    setEmojiBarOpenId(msg.id);
                  }}
                >
                  <div className={styles.chatMsgContent}>
                    {mediaLink && (
                      <MediaEmbed
                        content={mediaLink}
                        openYouTube={openYouTubePlayers[msg?.id]}
                        setOpenYouTube={open => setOpenYouTubePlayers(prev => ({ ...prev, [msg?.id]: open }))}
                      />
                    )}
                    {textBelow && (
                      <div className={styles.chatMsgTextBelow}>
                        {textBelow} {msg.edited && <span style={{ color: '#888', fontSize: 12, marginLeft: 4 }}>(edited)</span>}
                      </div>
                    )}
                    {mediaLink && (
                      <div className={styles.chatMsgTextBelow}>{mediaLink}</div>
                    )}
                    {(msg.type === 'image' && msg.fileUrl) && (
                      <div className={styles.chatMsgMediaWrapper}>
                        <img
                          src={msg?.fileUrl}
                          alt={msg?.fileName || 'sent image'}
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
                          Your browser does not support the audio element.
                        </audio>
                        <div className={styles.fileMeta}>{msg?.fileName} {msg?.fileSize ? `(${(msg?.fileSize / 1024 / 1024).toFixed(2)} MB)` : ''}</div>
                      </div>
                    )}
                    {(msg.type === 'video' && msg.fileUrl) && (
                      <div className={styles.chatMsgMediaWrapper}>
                        <video controls className={styles.chatVideoPlayer}>
                          <source src={msg?.fileUrl} type={msg?.fileType || 'video/mp4'} />
                          Your browser does not support the video tag.
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
                      msg.status === 'sent' ? (
                        <BsCheck style={{ color: '#888', fontSize: 16, marginRight: 4 }} />
                      ) : msg.status === 'delivered' ? (
                        <RiCheckDoubleLine style={{ color: '#888', fontSize: 16, marginRight: 4 }} />
                      ) : msg.status === 'seen' ? (
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
              key={msg.id}
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
              {/* Avatar for other user only, and only for last in group, as first child */}
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
                {/* Reactions bar above the message bubble */}
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
                    className={`${styles.messageMenuBtn} ${contextMenu.open && contextMenu.messageId === msg.id ? styles.active : ''}`}
                    style={{
                      right: '-40px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                    onClick={(e) => handleMessageMenuClick(e, msg.id, false)}
                    title="Message options"
                  >
                    <BsThreeDotsVertical size={16} />
                  </button>

                  {emojiBarOpenId === msg.id && (
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
                                onRemoveReaction(msg?.id);
                              } else {
                                onReact(msg?.id, emoji);
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
                  {/* Replied message bubble INSIDE the grey bubble, no border, no margin */}
                  {repliedMessage && (
                    <div className={styles.repliedMessageBubble} style={{ background: '#f5f5f7', borderRadius: 8, padding: '6px 10px', marginBottom: 0, maxWidth: '100%' }}>
                      <div style={{ fontSize: 13, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {repliedMessage.content}
                      </div>
                    </div>
                  )}
                  <div
                    className={styles.otherMsg}
                    style={{
                      maxWidth: 340,
                      wordBreak: 'break-word',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      setEmojiBarOpenId(msg.id);
                    }}
                  >
                    <div className={styles.chatMsgContent}>
                      {mediaLink && (
                        <MediaEmbed
                          content={mediaLink}
                          openYouTube={openYouTubePlayers[msg?.id]}
                          setOpenYouTube={open => setOpenYouTubePlayers(prev => ({ ...prev, [msg?.id]: open }))}
                        />
                      )}
                      {textBelow && (
                        <div className={styles.chatMsgTextBelow}>
                          {textBelow} {msg.edited && <span style={{ color: '#888', fontSize: 12, marginLeft: 4 }}>(edited)</span>}
                        </div>
                      )}
                      {mediaLink && (
                        <div className={styles.chatMsgTextBelow}>{mediaLink}</div>
                      )}
                      {(msg.type === 'image' && msg.fileUrl) && (
                        <div className={styles.chatMsgMediaWrapper}>
                          <img
                            src={msg?.fileUrl}
                            alt={msg?.fileName || 'sent image'}
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
                            Your browser does not support the audio element.
                          </audio>
                          <div className={styles.fileMeta}>{msg?.fileName} {msg?.fileSize ? `(${(msg?.fileSize / 1024 / 1024).toFixed(2)} MB)` : ''}</div>
                        </div>
                      )}
                      {(msg.type === 'video' && msg.fileUrl) && (
                        <div className={styles.chatMsgMediaWrapper}>
                          <video controls className={styles.chatVideoPlayer}>
                            <source src={msg?.fileUrl} type={msg?.fileType || 'video/mp4'} />
                            Your browser does not support the video tag.
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
                        msg.status === 'sent' ? (
                          <BsCheck style={{ color: '#888', fontSize: 16, marginRight: 4 }} />
                        ) : msg.status === 'delivered' ? (
                          <RiCheckDoubleLine style={{ color: '#888', fontSize: 16, marginRight: 4 }} />
                        ) : msg.status === 'seen' ? (
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
      {selectedUser && typingUsers[selectedUser.id] && (
        <div className={styles.typingIndicator}>{selectedUser.name} is typing...</div>
      )}

      {/* Message Context Menu */}
      <MessageContextMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        isOwnMessage={messages.find(m => m.id === contextMenu.messageId)?.senderId === myUserId}
        onClose={() => setContextMenu(prev => ({ ...prev, open: false }))}
        onReply={() => handleContextMenuAction('reply')}
        onThreadReply={() => handleContextMenuAction('threadReply')}
        onPin={() => handleContextMenuAction('pin')}
        onEdit={() => handleContextMenuAction('edit')}
        onDelete={() => handleContextMenuAction('delete')}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteConfirmation.open}
        title="Delete Message"
        message={`Are you sure you want to permanently delete this message?`}
        confirmText="DELETE"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default MessageList; 