import React from 'react';
// @ts-ignore
import styles from './ChatCard.module.css';
import { formatTo12Hour, generateInitials } from '@/utils/helperFunctions';

interface ChatCardProps {
  avatar: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  selected?: boolean;
  onClick?: () => void;
  isOnline?: boolean;
  isTyping?: boolean;
}

function formatLastSeenStatus(time: string) {
  if (!time) return '';
  if (time === 'Online') return 'Online';
  if (time.startsWith('Last seen')) return time;
  if (time === 'Yesterday') return 'Yesterday';
  // Otherwise, assume it's a date string (dd:mm:yy)
  return time;
}

const ChatCard: React.FC<ChatCardProps> = ({ avatar, name, lastMessage, time, unreadCount = 0, selected, onClick, isOnline, isTyping = false }) => {

  return (
    <li
      onClick={onClick}
      className={`${styles.chatCard}${selected ? ' ' + styles.selected : ''}`}
    >
      <div className={styles.avatarWrapper}>
        {avatar ? (
          <img src={avatar} alt={name} className={styles.avatar} />
        ) : (
          <div className={styles.avatarInitials}>
            {generateInitials(name)}
          </div>
        )}
        {/* {typeof isOnline === 'boolean' && (
          <span
            className={styles.avatarOnlineDot}
            style={{ background: isOnline ? 'var(--color-onlineDot)' : '#bbb' }}
            title={isOnline ? 'Online' : 'Offline'}
          />
        )} */}
      </div>
      <div className={styles.details}>
        <div className={styles.name}>{name}</div>
        <div className={styles.lastMsg}>
          {isTyping ? (
            <span className={styles.typingIndicator}>
              <span className={styles.typingDots}>...</span>{  }is typing
            </span>
          ) : (
            lastMessage
          )}
        </div>
      </div>
      <div className={styles.right}>
        {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
        <div className={styles.timestamp}>{formatLastSeenStatus(time)}</div>
      </div>
    </li>
  );
};

export default ChatCard; 