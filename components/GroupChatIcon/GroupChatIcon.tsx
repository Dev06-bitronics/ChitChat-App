import React from 'react';
import { BsPeople } from 'react-icons/bs';
import styles from './GroupChatIcon.module.css';

interface GroupChatIconProps {
  name?: string;
  size?: number;
}

const GroupChatIcon: React.FC<GroupChatIconProps> = ({ name, size = 40 }) => {
  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'G';

  return (
    <div 
      className={styles.groupIcon}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.4
      }}
    >
      {name ? initials : <BsPeople size={size * 0.6} />}
    </div>
  );
};

export default GroupChatIcon;
