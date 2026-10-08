import React, { useRef, useEffect, useState } from 'react';
import SimpleLoadingAnimation from './SimpleLoadingAnimation';
import styles from './LoadingOverlay.module.css';

const LoadingOverlay = () => {
  const overlayRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!overlayRef.current) return;
    
    // Set initial dimensions
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  const updateDimensions = () => {
    if (!overlayRef.current) return;
    
    setDimensions({
      width: overlayRef.current.clientWidth,
      height: overlayRef.current.clientHeight
    });
  };

  return (
    <div className={styles.loadingOverlay} ref={overlayRef}>
      <SimpleLoadingAnimation 
        width={dimensions.width} 
        height={dimensions.height} 
      />
      
    </div>
  );
};

export default LoadingOverlay; 