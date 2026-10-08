import React from 'react';
import styles from './ViewButton.module.css';

const View3DIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"></path>
    <path d="M5.3 5.3l13.4 13.4"></path>
    <path d="M8.6 2.5c1.1.9 2 2 2.6 3.2a19 19 0 0 1 2.9-2 19 19 0 0 1-5.3 5.4 20.7 20.7 0 0 1-3-4 20.7 20.7 0 0 1 2.8-2.6Z"></path>
  </svg>
);

const View2DIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <path d="M3 9h18"></path>
    <path d="M9 3v18"></path>
  </svg>
);

const ViewButton = ({ 
  viewMode, 
  setViewMode, 
  isCompact = false,
  onMouseEnter,
  onMouseLeave 
}) => {
  const toggle = () => {
    setViewMode(viewMode === '2D' ? '3D' : '2D');
  };
  
  // In compact mode, return just the icon
  if (isCompact) {
    return (
      <button 
        className={styles.viewToggleCompact}
        onClick={toggle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {viewMode === '2D' ? <View3DIcon /> : <View2DIcon />}
        <span>{viewMode === '2D' ? '3D' : '2D'}</span>
      </button>
    );
  }
  
  // Original button design for non-compact mode
  return (
    <button 
      className={`${styles.viewToggle} ${viewMode === '3D' ? 'view-3d' : 'view-2d'}`}
      onClick={toggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {viewMode === '2D' ? '3D View' : '2D View'}
    </button>
  );
};

export default ViewButton; 