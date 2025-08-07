import React, { useState } from 'react';
import { User } from '@/screens/ChatScreen/ChatScreen.types';
import { UI } from '@/constants';
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

  const removableUsers = users.filter(user =>
    !user.isGroup &&
    currentParticipants.includes(user._id) &&
    user._id !== myUserId
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
          <h3>{UI.MODALS.REMOVE_USERS_FROM_GROUP(groupName)}</h3>
          <button className={styles.closeBtn} onClick={handleClose}>
            {UI.BUTTONS.CLOSE}
          </button>
        </div>

        <div className={styles.modalBody}>
          {removableUsers.length === 0 ? (
            <p className={styles.noUsers}>{UI.EMPTY_STATES.NO_USERS_AVAILABLE_REMOVE}</p>
          ) : (
            <>
              <p className={styles.instruction}>
                {UI.MODALS.SELECT_USERS_TO_REMOVE}
              </p>
              <div className={styles.usersList}>
                {removableUsers.map(user => (
                  <div
                    key={user._id}
                    className={`${styles.userItem} ${selectedUsers.includes(user._id) ? styles.selected : ''
                      }`}
                    onClick={() => handleUserToggle(user._id)}
                  >
                    <div className={styles.userAvatar}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {user.name?.charAt(0)?.toUpperCase() || UI.LABELS.USER.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{user.name}</div>
                      {user.isOnline && (
                        <div className={styles.onlineStatus}>{UI.STATUS.ONLINE}</div>
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
            {UI.BUTTONS.CANCEL}
          </button>
          <button
            className={`${styles.removeBtn} ${styles.dangerBtn}`}
            onClick={handleSubmit}
            disabled={selectedUsers.length === 0}
          >
            {UI.BUTTONS.REMOVE} {selectedUsers.length > 0 ? `${selectedUsers.length} ` : ''}{selectedUsers.length !== 1 ? UI.LABELS.USERS : UI.LABELS.USER}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveUsersModal;
