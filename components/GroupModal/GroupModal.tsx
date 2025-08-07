import React, { useState, useEffect } from 'react';
//@ts-ignore
import styles from './GroupModal.module.css';
import { User } from '@/screens/ChatScreen/ChatScreen.types';
import { MESSAGES, UI } from '@/constants';
import { GROUP_ALL_USERS } from '@/api/api';

interface GroupModalProps {
  open: boolean;
  onClose: () => void;
  myUserId: string;
  onCreateGroup: (name: string, selectedUsers: User[]) => void;
}

const GroupModal: React.FC<GroupModalProps> = ({ open, onClose, myUserId, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
      fetchAllUsers();
    }
  }, [open]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await GROUP_ALL_USERS();
      if (response && response.status === 200) {
        console.log('GROUP_ALL_USERS API response:', response.data);
        // Filter out groups and current user, keep only regular users
        const fetchedUsers = response.data?.data?.filter((user: any) =>
          !user.isGroup && user._id !== myUserId
        ) || [];
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const handleUserToggle = (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    setSelectedUsers(prev =>
      prev.find(u => u._id === userId)
        ? prev.filter(u => u._id !== userId)
        : [...prev, user]
    );
  };

  const handleCreate = () => {
    if (selectedUsers.length > 0) {
      onCreateGroup(groupName.trim(), selectedUsers);
      setGroupName('');
      setSelectedUsers([]);
      onClose();
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedUsers([]);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{UI.MODALS.CREATE_NEW_GROUP}</h3>
          <button className={styles.closeBtn} onClick={handleClose}>
            {UI.BUTTONS.CLOSE}
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder={UI.MODALS.GROUP_NAME_PLACEHOLDER}
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className={styles.input}
            />
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>{MESSAGES.LOADING.USERS}</p>
            </div>
          ) : users.length === 0 ? (
            <p className={styles.noUsers}>{UI.EMPTY_STATES.NO_USERS_AVAILABLE_GROUP}</p>
          ) : (
            <>
              <p className={styles.instruction}>
                {UI.MODALS.SELECT_USERS_INSTRUCTION}
              </p>
              <div className={styles.usersList}>
                {users.map(user => (
                  <div
                    key={user._id}
                    className={`${styles.userItem} ${selectedUsers.find(u => u._id === user._id) ? styles.selected : ''
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
                      {selectedUsers.find(u => u._id === user._id) && '✓'}
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
            className={styles.createBtn}
            onClick={handleCreate}
            disabled={selectedUsers.length === 0 || loading}
          >
            {UI.BUTTONS.CREATE} {UI.LABELS.GROUP} {selectedUsers.length > 0 ? `(${selectedUsers.length} ${selectedUsers.length === 1 ? UI.LABELS.USER.toLowerCase() : UI.LABELS.USERS.toLowerCase()})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
