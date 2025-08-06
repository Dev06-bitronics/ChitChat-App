// components/PinnedMessages/PinnedMessages.tsx
import React from 'react';
import styles from './PinnedMessages.module.css';
import { MdPushPin } from 'react-icons/md';
import { Message } from '@/screens/ChatScreen/ChatScreen.types';

interface PinnedMessagesProps {
  pinnedMessages: Message[];
  onPinnedMessageClick: (messageId: string) => void;
}

export const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  pinnedMessages,
  onPinnedMessageClick,
}) => {
  if (pinnedMessages.length === 0) return null;

  return (
    <div className={styles.pinnedContainer}>
      {pinnedMessages.map((message) => (
        <div
          key={message.id || message._id}
          className={styles.pinnedMessage}
          onClick={() => onPinnedMessageClick(message.id || message._id)}
        >
          <span className={styles.pinnedIcon} style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <MdPushPin size={18} />
          </span>
          <span className={styles.pinnedText} style={{ fontSize: 14, color: 'white', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {message?.content}
          </span>
        </div>
      ))}
    </div>
  );
};