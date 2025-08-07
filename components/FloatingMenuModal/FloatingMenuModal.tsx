import React, { useEffect, useState } from 'react';
//@ts-ignore
import styles from './FloatingMenuModal.module.css';
import { GET_PROFILE_DETAILS, GROUP_ALL_USERS } from '@/api/api';
import { MESSAGES, UI } from '@/constants';
import { useDispatch } from 'react-redux';

export interface FloatingMenuOption {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
  customElement?: React.ReactNode;
}

interface FloatingMenuModalProps {
  open: boolean;
  onClose: () => void;
  options: FloatingMenuOption[];
  user?: {
    avatar: string;
    name: string;
  };
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const FloatingMenuModal: React.FC<FloatingMenuModalProps> = ({
  open,
  onClose,
  options,
  user,
  theme,
  toggleTheme,
  onMouseEnter,
  onMouseLeave,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const [profileData, setProfileData] = useState<{
    name: string;
    avatar: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !profileData) {
      fetchProfile();
    }
  }, [open]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await GET_PROFILE_DETAILS();
      if (response && response.status === 200) {
        const profile = response.data?.data;
        if (profile) {
          setProfileData({
            name: profile.name || UI.LABELS.USER,
            avatar: profile.avatar || user?.avatar || '/logo.png'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileData({
        name: user?.name || UI.LABELS.USER,
        avatar: user?.avatar || '/logo.png'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await GROUP_ALL_USERS();
      if (response && response.status === 200) {
        console.log(response.data, "response.groupdata------------------->");

      }
    } catch (error) {
      console.error('Error fetching profile:', error);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const handleOverlayMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.relatedTarget && menuRef.current && menuRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    onClose();
  };

  const displayUser = profileData || user || { name: UI.LABELS.USER, avatar: '/logo.png' };

  if (!open) return null;
  return (
    <div
      className={styles.overlay}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={styles.menu}
        ref={menuRef}
      >
        {displayUser && (
          <div className={styles.userHeader}>
            <img src={displayUser.avatar} alt={displayUser.name} className={styles.avatar} />
            <div className={styles.userName}>
              {loading ? MESSAGES.LOADING.DEFAULT : displayUser.name}
            </div>
          </div>
        )}
        <ul className={styles.optionsList}>
          {options.map((opt, idx) =>
            (opt.label === UI.MENU.DARK_MODE || opt.label === UI.MENU.SIGN_OUT) ? null : (
              <li key={idx} className={styles.option} onClick={opt.onClick} style={{ cursor: 'pointer' }}>
                <span className={styles.icon}>{opt.icon}</span>
                <span className={styles.label}>{opt.label}</span>
                {opt.customElement}
                {typeof opt.badge === 'number' && (
                  <span className={styles.badge}>{opt.badge}</span>
                )}
              </li>
            )
          )}
          {/* Render dark mode option just above logout */}
          {options.filter(opt => opt.label === UI.MENU.DARK_MODE).map((opt, idx) => (
            <li key={idx} className={styles.option} style={{ cursor: 'default' }}>
              <span className={styles.icon}>{opt.icon}</span>
              <span className={styles.label}>{opt.label}</span>
              <label className={styles.switch} onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                <span className={styles.slider}></span>
              </label>
            </li>
          ))}
          {/* Logout always last */}
          {options.map((opt, idx) =>
            opt.label === UI.MENU.SIGN_OUT ? (
              <li key={idx} className={styles.option} onClick={opt.onClick} style={{ cursor: 'pointer' }}>
                <span className={styles.icon}>{opt.icon}</span>
                <span className={styles.label}>{opt.label}</span>
                {opt.customElement}

                {typeof opt.badge === 'number' && (
                  <span className={styles.badge}>{opt.badge}</span>
                )}
              </li>
            ) : null
          )}
        </ul>
      </div>
    </div>
  );
};
export default FloatingMenuModal; 