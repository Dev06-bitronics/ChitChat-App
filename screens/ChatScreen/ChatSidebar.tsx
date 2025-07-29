import React from 'react';
import { User } from './ChatScreen.types';
//@ts-ignore
import styles from './ChatScreen.module.css';
import ChatCard from '@/components/ChatCard/ChatCard';
import Loader from '@/components/Loader/Loader';
import NoDataFound from '@/components/NoDataFound/NoDataFound';
import { FaBars, FaSearch } from 'react-icons/fa';
import { formatTo12Hour } from '@/utils/helperFunctions';

interface ChatSidebarProps {
  users: User[];
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  loading?: boolean;
  unreadCounts?: { [userId: string]: number };
  getLastSeenStatus?: (user: User) => string;
  onMenu?: (open: boolean) => void;
  myUserId: string; // Added myUserId prop
  typingUsers?: { [userId: string]: boolean }; // Added typing status
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ users, selectedUser, onUserSelect, loading, unreadCounts = {}, getLastSeenStatus, onMenu, myUserId, typingUsers = {} }) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.chatSidebarHeader}>
        <div
          className={styles.hamburgerMenuWrapper}
          onClick={onMenu ? () => onMenu(true) : undefined}
          onMouseEnter={onMenu ? () => onMenu(true) : undefined}
          onMouseLeave={onMenu ? () => onMenu(false) : undefined}
        >
          <FaBars className={styles.hamburgerIcon} />
        </div>
        <div className={styles.searchInputWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search"
            className={styles.chatSearchInput}
          />
        </div>
      </div>
      <ul className={styles.userList}>
        {loading ? (
          <Loader message='fetching users' visible={loading} />
        ) : (
          users && users.length > 0 ? (
            users.map((user) => (
              <ChatCard
                key={user._id}
                avatar={user.avatar || ''}
                name={user.name}
                lastMessage={
                  user.lastMessageSender === myUserId
                    ? `You: ${user.lastMessage || ''}`
                    : user.lastMessage || ''
                }
                time={
                  !user.isOnline && getLastSeenStatus
                    ? getLastSeenStatus(user)
                    : user.lastMessageTimestamp
                      ? formatTo12Hour(user.lastMessageTimestamp)
                      : ''
                }
                unreadCount={user.id && unreadCounts[user.id] !== undefined ? unreadCounts[user.id] : (user.unreadCount || 0)}
                selected={selectedUser?._id === user._id}
                onClick={() => onUserSelect(user)}
                isOnline={user.isOnline}
                isTyping={typingUsers[user.id] || false}
              />
            ))
          ) : (
            <NoDataFound message="You currently have no channels" />
          )
        )}
      </ul>
    </aside>
  );
};

export default ChatSidebar; 