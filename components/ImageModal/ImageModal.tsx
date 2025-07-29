import React from 'react';
//@ts-ignore
import styles from './ImageModal.module.css';

interface UserInfo {
  avatar: string;
  name: string;
  online?: boolean;
}

interface ImageModalProps {
  open: boolean;
  imageUrl: string;
  imageName?: string;
  user: UserInfo;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ open, imageUrl, imageName, user, onClose }) => {
  if (!open) return null;
  return (
    <div className={styles.imageModalOverlay} onClick={onClose}>
      <div className={styles.imageModalTopBar} onClick={e => e.stopPropagation()}>
        <div className={styles.imageModalUserInfo}>
          <img src={user.avatar} alt={user.name} className={styles.imageModalAvatar} />
          <div>
            <div className={styles.imageModalUserName}>{user.name}</div>
            <div className={styles.imageModalUserStatus}>{user.online ? 'Online' : 'Offline'}</div>
          </div>
        </div>
        <div className={styles.imageModalActions}>
          <a
            href={imageUrl}
            download={imageName}
            className={styles.imageModalDownloadBtn}
            title="Download"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          </a>
          <button className={styles.imageModalCloseBtn} onClick={onClose} title="Close">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>
      <div className={styles.imageModalContent} onClick={e => e.stopPropagation()}>
        <img src={imageUrl} alt={imageName || 'Image'} className={styles.imageModalImgFull} />
      </div>
    </div>
  );
};

export default ImageModal; 