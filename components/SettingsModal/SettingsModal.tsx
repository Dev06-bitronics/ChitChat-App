import React from 'react';
//@ts-ignore
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  open: boolean;
  profile: { name: string; avatar: string; description: string };
  errors: { name?: string; description?: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, profile, errors, onChange, onSave, onClose, onAvatarChange, onLogout }) => {
  if (!open) return null;
  return (
    <div className={styles.settingsModalOverlay}>
      <div className={styles.settingsModal}>
        <h2>Edit Profile</h2>
        <form className={styles.profileEditForm} onSubmit={onSave} autoComplete="off">
          <label>Profile Picture
            <input type="file" accept="image/*" onChange={onAvatarChange} />
          </label>
          <img src={profile.avatar} alt="Profile" className={styles.profileAvatar} />
          <label>Name
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={onChange}
              autoComplete="off"
            />
            {errors.name && <div className={styles.error}>{errors.name}</div>}
          </label>
          <label>Description
            <textarea
              name="description"
              value={profile.description}
              onChange={onChange}
              autoComplete="off"
            />
            {errors.description && <div className={styles.error}>{errors.description}</div>}
          </label>
          <button type="submit" className={styles.submitBtn} style={{ marginTop: 8 }}>Save</button>
        </form>
        <button className={styles.logoutBtn} onClick={onLogout}>Logout</button>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default SettingsModal; 