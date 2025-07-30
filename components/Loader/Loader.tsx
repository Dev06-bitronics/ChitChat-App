import React from 'react';
import styles from './Loader.module.css'; 

interface LoaderProps {
  visible?: boolean;
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ visible, message }) => {
  if (!visible) return null;
  return (
    <div className={styles['loader-overlay']}>
      <div className={styles['loader-container']}>
        <div className={styles['loader-spinner']} />
        {message && <div className={styles['loader-message']}>{message}</div>}
      </div>
    </div>
  );
};

export default Loader;
