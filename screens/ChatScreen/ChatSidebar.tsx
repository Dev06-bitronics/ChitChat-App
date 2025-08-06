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
  myUserId: string;
  typingUsers?: { [userId: string]: boolean };
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  users,
  selectedUser,
  onUserSelect,
  loading,
  unreadCounts = {},
  getLastSeenStatus,
  onMenu,
  myUserId,
  typingUsers = {}
}) => {
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
        ) : users && users.length > 0 ? (
          users.map((participant) => (
            <ChatCard
              key={participant._id}
              avatar={participant.avatar || ''}
              name={participant.name}
              lastMessage={
                participant.lastMessage
                  ? typeof participant.lastMessage === 'object'
                    ? participant.isGroup
                      ? `${participant.lastMessage.senderId === myUserId ? 'You' : 'Someone'}: ${participant.lastMessage.content}`
                      : participant.lastMessage.senderId === myUserId
                        ? `You: ${participant.lastMessage.content}`
                        : participant.lastMessage.content
                    : participant.lastMessage
                  : participant.isGroup
                    ? 'No messages yet'
                    : ''
              }
              time={
                !participant.isGroup && !participant.isOnline && getLastSeenStatus
                  ? getLastSeenStatus(participant)
                  : participant.lastMessage?.timestamp
                    ? formatTo12Hour(participant.lastMessage.timestamp)
                    : ''
              }
              unreadCount={
                participant._id && unreadCounts[participant._id] !== undefined
                  ? unreadCounts[participant._id]
                  : participant.unreadCount || 0
              }
              selected={selectedUser?._id === participant._id}
              onClick={() => onUserSelect(participant)}
              isOnline={participant.isGroup ? undefined : participant.isOnline}
              isTyping={typingUsers[participant._id] || false}
              isGroup={participant.isGroup || false}
              members={participant.isGroup ? participant.members : undefined}
            />
          ))
        ) : (
          <NoDataFound message="You currently have no channels" />
        )}
      </ul>
    </aside>
  );
};

export default ChatSidebar;