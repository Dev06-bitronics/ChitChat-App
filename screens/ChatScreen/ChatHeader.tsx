import React from 'react';
import { User } from './ChatScreen.types';
//@ts-ignore
import styles from './ChatScreen.module.css';
import { generateInitials } from '@/utils/helperFunctions';

interface ChatHeaderProps {
  selectedUser: User | null;
  unreadCount: number;
  getLastSeenStatus: (user: User) => string;
  onSettings?: () => void;
  onMenu?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ selectedUser, unreadCount, getLastSeenStatus, onSettings, onMenu }) => {
  if (!selectedUser) return null;
  return (
    <div className={styles.chatHeader}>
      <div className={styles.avatarWrapper}>
        {selectedUser.avatar ? (
          <img src={selectedUser.avatar} alt={selectedUser.name} className={styles.avatar} />
        ) : (
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--color-primaryGradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-bubbleSelfText)',
            fontWeight: 600,
            fontSize: '1.1rem',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
          }}>
            {generateInitials(selectedUser?.name)}
          </div>
        )}
        {selectedUser?.isOnline && <div className={styles.avatarOnlineDot} />}
      </div>
      <div>
        <div className={styles.userName}>
          {selectedUser.name}
          {unreadCount > 0 && (
            <span className={styles.unreadBadge} style={{ marginLeft: 8 }}>{unreadCount}</span>
          )}
        </div>
        <div className={styles.userStatus}>{getLastSeenStatus(selectedUser)}</div>
      </div>
      {onMenu && (
        <button className={styles.settingsBtn} onClick={onMenu} title="Menu">
          ☰
        </button>
      )}
    </div>
  );
};

export default ChatHeader; 