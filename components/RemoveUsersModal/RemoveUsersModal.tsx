import React, { useState } from 'react';
import { User } from '@/screens/ChatScreen/ChatScreen.types';
//@ts-ignore
import styles from './RemoveUsersModal.module.css';

interface RemoveUsersModalProps {
  open: boolean;
  onClose: () => void;
  users: User[];
  groupId: string;
  groupName: string;
  currentParticipants: string[];
  myUserId: string;
  onRemoveUsers: (groupId: string, selectedUserIds: string[]) => void;
}

const RemoveUsersModal: React.FC<RemoveUsersModalProps> = ({
  open,
  onClose,
  users,
  groupId,
  groupName,
  currentParticipants,
  myUserId,
  onRemoveUsers,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Filter to show only current group members (excluding the admin/creator)
  const removableUsers = users.filter(user => 
    !user.isGroup && 
    currentParticipants.includes(user._id) && 
    user._id !== myUserId // Admin can't remove themselves
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (selectedUsers.length > 0) {
      onRemoveUsers(groupId, selectedUsers);
      setSelectedUsers([]);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Remove Users from "{groupName}"</h3>
          <button className={styles.closeBtn} onClick={handleClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {removableUsers.length === 0 ? (
            <p className={styles.noUsers}>No users available to remove from this group.</p>
          ) : (
            <>
              <p className={styles.instruction}>
                Select users to remove from the group:
              </p>
              <div className={styles.usersList}>
                {removableUsers.map(user => (
                  <div
                    key={user._id}
                    className={`${styles.userItem} ${
                      selectedUsers.includes(user._id) ? styles.selected : ''
                    }`}
                    onClick={() => handleUserToggle(user._id)}
                  >
                    <div className={styles.userAvatar}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{user.name}</div>
                      {user.isOnline && (
                        <div className={styles.onlineStatus}>Online</div>
                      )}
                    </div>
                    <div className={styles.checkbox}>
                      {selectedUsers.includes(user._id) && '✓'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={handleClose}>
            Cancel
          </button>
          <button
            className={`${styles.removeBtn} ${styles.dangerBtn}`}
            onClick={handleSubmit}
            disabled={selectedUsers.length === 0}
          >
            Remove {selectedUsers.length > 0 ? `${selectedUsers.length} ` : ''}User{selectedUsers.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveUsersModal;
