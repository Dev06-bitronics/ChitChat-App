import React, { useState, useRef, useEffect } from 'react';
import { User } from './ChatScreen.types';
//@ts-ignore
import styles from './ChatScreen.module.css';
import { generateInitials } from '@/utils/helperFunctions';
import { UI } from '@/constants';

interface ChatHeaderProps {
  selectedUser: User | null;
  unreadCount: number;
  getLastSeenStatus: (user: User) => string;
  onSettings?: () => void;
  onMenu?: () => void;
  myUserId?: string;
  onLeaveGroup?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onAddUsers?: (groupId: string) => void;
  onRemoveUsers?: (groupId: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedUser,
  unreadCount,
  getLastSeenStatus,
  onSettings,
  onMenu,
  myUserId,
  onLeaveGroup,
  onDeleteGroup,
  onAddUsers,
  onRemoveUsers
}) => {
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowGroupSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  if (!selectedUser) return null;
  return (
    <div className={styles.chatHeader}>
      <div className={styles.avatarWrapper}>
        {selectedUser?.avatar ? (
          <img src={selectedUser?.avatar} alt={selectedUser?.name} className={styles.avatar} />
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
          {selectedUser?.name}
          {/* {unreadCount > 0 && (
            <span className={styles.unreadBadge} style={{ marginLeft: 8 }}>{unreadCount}</span>
          )} */}
        </div>
        <div className={styles.userStatus}>{getLastSeenStatus(selectedUser)}</div>
      </div>
      <div className={styles.headerActions}>
        {/* Group Settings Dropdown */}
        {selectedUser?.isGroup && myUserId && (
          <div className={styles.groupSettingsWrapper} ref={settingsRef}>
            <button
              className={styles.groupSettingsBtn}
              onClick={() => setShowGroupSettings(!showGroupSettings)}
              title={UI.CHAT_HEADER.GROUP_SETTINGS}
            >
              ⚙️
            </button>

            {showGroupSettings && (
              <div className={styles.groupSettingsDropdown}>
                {/* Leave Group - Available for all members */}
                {selectedUser?.participantsStatus?.[myUserId] === 'joined' && onLeaveGroup && (
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      onLeaveGroup(selectedUser._id);
                      setShowGroupSettings(false);
                    }}
                  >
                    {UI.CHAT_HEADER.LEAVE_GROUP}
                  </button>
                )}

                {/* Admin only options */}
                {selectedUser?.createdBy === myUserId && (
                  <>
                    {onAddUsers && (
                      <button
                        className={styles.dropdownItem}
                        onClick={() => {
                          onAddUsers(selectedUser._id);
                          setShowGroupSettings(false);
                        }}
                      >
                        {UI.CHAT_HEADER.ADD_USERS}
                      </button>
                    )}
                    {onRemoveUsers && (
                      <button
                        className={styles.dropdownItem}
                        onClick={() => {
                          onRemoveUsers(selectedUser._id);
                          setShowGroupSettings(false);
                        }}
                      >
                        {UI.CHAT_HEADER.REMOVE_USERS}
                      </button>
                    )}
                    {onDeleteGroup && (
                      <button
                        className={styles.dropdownItem + ' ' + styles.dangerItem}
                        onClick={() => {
                          onDeleteGroup(selectedUser._id);
                          setShowGroupSettings(false);
                        }}
                      >
                        {UI.CHAT_HEADER.DELETE_GROUP}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {onMenu && (
          <button className={styles.settingsBtn} onClick={onMenu} title={UI.CHAT_HEADER.MENU}>
            ☰
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader; 