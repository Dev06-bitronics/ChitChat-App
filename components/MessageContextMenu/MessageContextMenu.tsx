import React from 'react';
//@ts-ignore
import styles from './MessageContextMenu.module.css';
import { BiReply, BiMessageRoundedDetail } from 'react-icons/bi';
import { FiEdit3 } from 'react-icons/fi';
import { BsPin } from 'react-icons/bs';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { UI } from '@/constants';

interface MessageContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  isOwnMessage: boolean;
  onClose: () => void;
  onReply: () => void;
  onThreadReply: () => void;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
  isPinned?: boolean;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({ open, x, y, isOwnMessage, isPinned = false, onClose, onReply, onThreadReply, onEdit, onPin, onDelete }) => {
  if (!open) return null;
  return (
    <div className={styles.contextMenuOverlay} onClick={onClose}>
      <div
        className={styles.contextMenu}
        data-context-menu
        style={{
          left: x,
          top: y,
          transform: isOwnMessage ? 'translate(-30%, -100%)' : 'translate(-10%, -100%)',
          marginTop: '-8px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.contextMenuItem} onClick={onReply}>
          <BiReply className={styles.contextMenuIcon} />
          <span>{UI.CONTEXT_MENU.REPLY}</span>
        </div>
        <div className={styles.contextMenuItem} onClick={onThreadReply}>
          <BiMessageRoundedDetail className={styles.contextMenuIcon} />
          <span>{UI.CONTEXT_MENU.THREAD_REPLY}</span>
        </div>
        {isOwnMessage && (
          <div className={styles.contextMenuItem} onClick={onEdit}>
            <FiEdit3 className={styles.contextMenuIcon} />
            <span>{UI.CONTEXT_MENU.EDIT_MESSAGE}</span>
          </div>
        )}
        <div className={styles.contextMenuItem} onClick={onPin}>
          <BsPin className={styles.contextMenuIcon} style={isPinned ? { transform: 'rotate(45deg)' } : undefined} />
          <span>{isPinned ? UI.CONTEXT_MENU.UNPIN_MESSAGE : UI.CONTEXT_MENU.PIN_MESSAGE}</span>
        </div>
        {isOwnMessage && (
          <div className={`${styles.contextMenuItem} ${styles.contextMenuItemDelete}`} onClick={onDelete}>
            <RiDeleteBin6Line className={styles.contextMenuIcon} />
            <span>{UI.CONTEXT_MENU.DELETE_MESSAGE}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageContextMenu; 