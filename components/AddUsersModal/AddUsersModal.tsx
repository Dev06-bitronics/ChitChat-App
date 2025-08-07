import React, { useState, useEffect } from 'react';
import { User } from '@/screens/ChatScreen/ChatScreen.types';
import { ADD_USERS_TO_GROUP } from '@/api/api';
import { MESSAGES, UI } from '@/constants';
//@ts-ignore
import styles from './AddUsersModal.module.css';

interface ManageUsersModalProps {
  open: boolean;
  onClose: () => void;
  allUsers: User[];
  groupId: string;
  groupName: string;
  currentParticipants: string[];
  onAddUsers?: (groupId: string, selectedUserIds: string[]) => void;
  onRemoveUsers?: (groupId: string, selectedUserIds: string[]) => void;
  mode: 'add' | 'remove';
  myUserId: string;
}

const ManageUsersModal: React.FC<ManageUsersModalProps> = ({
  open,
  onClose,
  allUsers,
  groupId,
  groupName,
  currentParticipants,
  onAddUsers,
  onRemoveUsers,
  mode,
  myUserId,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsersForAdd, setAvailableUsersForAdd] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && mode === 'add') {
      fetchAvailableUsers();
    }
  }, [open, mode, groupId]);

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);
      const response = await ADD_USERS_TO_GROUP(groupId);
      if (response && response.status === 200) {
        console.log('ADD_USERS_TO_GROUP API response:', response.data);
        const users = response.data?.data || [];
        setAvailableUsersForAdd(users);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      setAvailableUsersForAdd([]);
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = mode === 'add'
    ? availableUsersForAdd
    : allUsers.filter(user => !user.isGroup && currentParticipants.includes(user._id) && user._id !== myUserId);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (selectedUsers.length > 0) {
      if (mode === 'add' && onAddUsers) {
        onAddUsers(groupId, selectedUsers);
      } else if (mode === 'remove' && onRemoveUsers) {
        onRemoveUsers(groupId, selectedUsers);
      }
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
          <h3>{mode === 'add' ? UI.MODALS.ADD_USERS_TO_GROUP(groupName) : UI.MODALS.REMOVE_USERS_FROM_GROUP(groupName)}</h3>
          <button className={styles.closeBtn} onClick={handleClose}>
            {UI.BUTTONS.CLOSE}
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading && mode === 'add' ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>{MESSAGES.LOADING.AVAILABLE_USERS}</p>
            </div>
          ) : availableUsers.length === 0 ? (
            <p className={styles.noUsers}>
              {mode === 'add'
                ? UI.EMPTY_STATES.NO_USERS_AVAILABLE_ADD
                : UI.EMPTY_STATES.NO_USERS_AVAILABLE_REMOVE}
            </p>
          ) : (
            <>
              <p className={styles.instruction}>
                {mode === 'add' ? UI.MODALS.SELECT_USERS_TO_ADD : UI.MODALS.SELECT_USERS_TO_REMOVE}
              </p>
              <div className={styles.usersList}>
                {availableUsers.map(user => (
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
                      {(user.isOnline || user.online) && (
                        <div className={styles.onlineStatus}>Online</div>
                      )}
                      {!(user.isOnline || user.online) && user.lastSeen && (
                        <div className={styles.lastSeen}>
                          Last seen: {new Date(user.lastSeen).toLocaleDateString()}
                        </div>
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
            className={mode === 'add' ? styles.addBtn : `${styles.addBtn} ${styles.removeBtn}`}
            onClick={handleSubmit}
            disabled={selectedUsers.length === 0}
          >
            {mode === 'add' ? UI.BUTTONS.ADD : UI.BUTTONS.REMOVE} {selectedUsers.length > 0 ? `${selectedUsers.length} ` : ''}{selectedUsers.length !== 1 ? UI.LABELS.USERS : UI.LABELS.USER}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersModal;
