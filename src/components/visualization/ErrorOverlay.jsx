import React from 'react';
import styles from './ErrorOverlay.module.css';

const ErrorOverlay = ({ error }) => (
  <div className={styles.errorOverlay}>
    <p>{error}</p>
    
  </div>
);

export default ErrorOverlay; 