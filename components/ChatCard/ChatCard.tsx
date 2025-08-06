import React from 'react';
// @ts-ignore
import styles from './ChatCard.module.css';
import { formatTo12Hour, generateInitials } from '@/utils/helperFunctions';
import { HiOutlineUserGroup } from 'react-icons/hi';
import { HiUserGroup } from "react-icons/hi2";

interface ChatCardProps {
  _id: string;
  name: string;
  avatar?: string | null;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: string;
    type: string;
  } | string | null;
  time?: string;
  unreadCount?: number;
  selected?: boolean;
  onClick?: () => void;
  isOnline?: boolean;
  isTyping?: boolean;
  isGroup: boolean;
  participants?: string[];
  createdBy?: string;
  lastSeen?: string | null;
  myUserId?: string; // Added this prop
}

const ChatCard: React.FC<ChatCardProps> = ({
  _id,
  name,
  avatar,
  lastMessage,
  time,
  unreadCount = 0,
  selected = false,
  onClick,
  isOnline = false,
  isTyping = false,
  isGroup = false,
  participants = [],
  lastSeen,
  myUserId
}) => {
  const displayName = name || 'Unknown';
  const timestamp = time || (typeof lastMessage === 'object' ? lastMessage?.timestamp : '');
  const memberCount = participants?.length || 0;

  const initials = generateInitials(name);

  const getMessageContent = () => {
    if (isTyping) return <span className={styles.typingIndicator}>... is typing</span>;

    // Handle old string format
    if (typeof lastMessage === 'string') return lastMessage;

    // Handle new object format
    if (lastMessage?.content) {
      const isMyMessage = lastMessage.senderId === myUserId;
      return isMyMessage ? `You: ${lastMessage.content}` : lastMessage.content;
    }

    return isGroup ? 'No messages yet' : '';
  };

  return (
    <li
      onClick={onClick}
      className={`${styles.chatCard}${selected ? ' ' + styles.selected : ''}`}
      aria-selected={selected}
    >
      <div className={styles.avatarWrapper}>
        {/* Group Chat - Always show group icon */}
        {isGroup ? (
          <div className={styles.avatarInitials}>
            <HiUserGroup color='var(--color-primaryGradient)' size={22} />
            {memberCount > 0 && (
              <div className={styles.groupBadge} title={`Group with ${memberCount} members`}>
                <HiOutlineUserGroup />
                <span className={styles.memberCount}>{memberCount}</span>
              </div>
            )}
          </div>
        ) : (
          /* Individual Chat - Show avatar or initials with online status */
          <>
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className={styles.avatar}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className={styles.avatarInitials}>
                {initials}
              </div>
            )}
            <span
              className={styles.avatarOnlineDot}
              style={{
                backgroundColor: isOnline ? 'var(--color-onlineDot)' : '#bbb',
                borderColor: `var(--background-color)`
              }}
              title={isOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen}` : 'Offline'}
              aria-label={isOnline ? 'Online' : 'Offline'}
            />
          </>
        )}
      </div>

      <div className={styles.details}>
        <div className={styles.name} title={displayName}>
          {displayName}
        </div>
        <div className={styles.lastMsg}>
          {getMessageContent()}
        </div>
      </div>

      <div className={styles.right}>
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <div className={styles.timestamp}>
          {isGroup ? formatTo12Hour(timestamp) : (isOnline ? 'Online' : formatTo12Hour(lastSeen || timestamp))}
        </div>
      </div>
    </li>
  );
};

export default ChatCard;