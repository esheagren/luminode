import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import LoadingAnimation from './visualization/LoadingAnimation';
import styles from './LandingPage.module.css';

const LandingPage = () => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  const updateDimensions = () => {
    if (!containerRef.current) return;
    
    setDimensions({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    });
  };

  return (
    <div className={styles.landingPage} ref={containerRef}>
      <div className={styles.animationBackground}>
        <LoadingAnimation 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      </div>
      
      <div className={styles.landingContent}>
        <h1 className={styles.landingTitle}>Luminode</h1>
        <p className={styles.landingTagline}>Explore the hidden relationships between words in a beautiful, interactive vector space</p>
        <div className={styles.buttonContainer}>
          <Link to="/app" state={{ fromLanding: true }} className={`${styles.appButton} ${styles.primaryButton}`}>
            Explore
          </Link>
        </div>
      </div>

      <footer className={styles.landingFooter}>
        <div className={styles.footerLinks}>
          <a href="https://eriksheagren.notion.site" target="_blank" rel="noopener noreferrer">
            Contact
          </a>
          <a href="https://github.com/esheagren/Luminode" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
        
        <div className={styles.footerAnimation}>
          <div className={`${styles.node} ${styles.node1}`}></div>
          <div className={`${styles.node} ${styles.node2}`}></div>
          <div className={`${styles.node} ${styles.node3}`}></div>
          <div className={`${styles.connection} ${styles.connection12}`}></div>
          <div className={`${styles.connection} ${styles.connection23}`}></div>
          <div className={`${styles.connection} ${styles.connection13}`}></div>
        </div>
      </footer>
      
    </div>
  );
};

export default LandingPage; 