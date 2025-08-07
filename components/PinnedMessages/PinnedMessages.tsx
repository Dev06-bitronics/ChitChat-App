import React from 'react';
//@ts-ignore
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
      <div className={styles.pinnedHeader}>
        <MdPushPin size={16} className={styles.headerIcon} />
        <span className={styles.headerText}>Pinned Messages ({pinnedMessages.length})</span>
      </div>
      <div className={styles.pinnedList}>
        {pinnedMessages.map((message, index) => (
          <div
            key={message.id || message._id}
            className={styles.pinnedMessage}
            onClick={() => onPinnedMessageClick(message.id || message._id)}
            title={message?.content}
          >
            <span className={styles.pinnedNumber}>{index + 1}</span>
            <span className={styles.pinnedText}>
              {message?.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};