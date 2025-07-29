import React from 'react';
import './Loader.css';

interface LoaderProps {
  visible?: boolean;
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ visible, message }) => {
  if (!visible) return null;
  return (
    <div className="loader-overlay">
      <div className="loader-container">
        <div className="loader-spinner" />
        {message && <div className="loader-message">{message}</div>}
      </div>
    </div>
  );
};

export default Loader;
