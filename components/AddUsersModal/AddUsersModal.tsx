import React, { useState, useEffect } from 'react';
import { User } from '@/screens/ChatScreen/ChatScreen.types';
import { ADD_USERS_TO_GROUP } from '@/api/api';
//@ts-ignore
import styles from './AddUsersModal.module.css';

interface ManageUsersModalProps {
  open: boolean;
  onClose: () => void;
  allUsers: User[]; // Keep this for remove mode (current group members)
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

  // Fetch available users for add mode when modal opens
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

  // Filtering users based on mode
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
          <h3>{mode === 'add' ? 'Add Users to' : 'Remove Users from'} "{groupName}"</h3>
          <button className={styles.closeBtn} onClick={handleClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading && mode === 'add' ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading available users...</p>
            </div>
          ) : availableUsers.length === 0 ? (
            <p className={styles.noUsers}>
              {mode === 'add'
                ? 'No users available to add to this group.'
                : 'No users available to remove from this group.'}
            </p>
          ) : (
            <>
              <p className={styles.instruction}>
                Select users to {mode === 'add' ? 'add to' : 'remove from'} the group:
              </p>
              <div className={styles.usersList}>
                {availableUsers.map(user => (
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
            Cancel
          </button>
          <button
            className={mode === 'add' ? styles.addBtn : `${styles.addBtn} ${styles.removeBtn}`}
            onClick={handleSubmit}
            disabled={selectedUsers.length === 0}
          >
            {mode === 'add' ? 'Add' : 'Remove'} {selectedUsers.length > 0 ? `${selectedUsers.length} ` : ''}User{selectedUsers.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersModal;
