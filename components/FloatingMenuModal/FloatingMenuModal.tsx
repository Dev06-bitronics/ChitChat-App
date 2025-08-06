import React, { useEffect, useState } from 'react';
//@ts-ignore
import styles from './FloatingMenuModal.module.css';
import { USER_LOGOUT, GET_PROFILE_DETAILS, GROUP_ALL_USERS } from '@/api/api';
import { useDispatch } from 'react-redux';
import { clearToken } from '@/redux/reducers/userReducer';
import { toast } from 'react-toastify';

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

  // Fetch profile data when modal opens
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
            name: profile.name || 'User',
            avatar: profile.avatar || user?.avatar || '/logo.png'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to user prop if API fails
      setProfileData({
        name: user?.name || 'User',
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

  // Close on click outside
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

  // Close on mouse leave (from overlay, not menu)
  const handleOverlayMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if mouse leaves the overlay, not when moving inside the menu
    if (e.relatedTarget && menuRef.current && menuRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    onClose();
  };

  // Use profile data if available, otherwise fallback to user prop
  const displayUser = profileData || user || { name: 'User', avatar: '/logo.png' };
            
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
      // onMouseLeave removed from here
      >
        {displayUser && (
          <div className={styles.userHeader}>
            <img src={displayUser.avatar} alt={displayUser.name} className={styles.avatar} />
            <div className={styles.userName}>
              {loading ? 'Loading...' : displayUser.name}
            </div>
          </div>
        )}
        <ul className={styles.optionsList}>
          {/* Render all options except logout and dark mode */}
          {options.map((opt, idx) =>
            (opt.label === 'Dark Mode' || opt.label === 'Sign Out') ? null : (
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
          {options.filter(opt => opt.label === 'Dark Mode').map((opt, idx) => (
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
            opt.label === 'Sign Out' ? (
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