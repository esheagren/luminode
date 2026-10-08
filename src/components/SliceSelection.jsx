import React from 'react';
import './ToolbarStyles.css';
import styles from './SliceSelection.module.css';

/**
 * Component displayed during slice selection mode
 */
const SliceSelection = ({ 
  selectedPoints, 
  onReset, 
  onCancel, 
  onCalculate, 
  loading
}) => {
  return (
    <div className={styles.sliceSelection}>
      <div className={styles.infoText}>
        <p>
          {selectedPoints.length === 0 && (
            "Select two points to create a semantic slice between them."
          )}
          {selectedPoints.length === 1 && (
            "Now select the end point to complete the slice."
          )}
          {selectedPoints.length === 2 && (
            `Ready to calculate slice from "${selectedPoints[0]}" to "${selectedPoints[1]}".`
          )}
        </p>
      </div>
      
      <div className={styles.selectionInfo}>
        {selectedPoints.length > 0 && (
          <div className={styles.selectedPoints}>
            <div className={styles.pointTag}>
              <span className={styles.pointLabel}>Start:</span>
              <span className={styles.pointValue}>{selectedPoints[0] || "None"}</span>
            </div>
            
            {selectedPoints.length > 1 && (
              <div className={styles.pointTag}>
                <span className={styles.pointLabel}>End:</span>
                <span className={styles.pointValue}>{selectedPoints[1]}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className={styles.selectionControls}>
        {selectedPoints.length > 0 && (
          <button 
            className={`${styles.controlButton} ${styles.reset}`}
            onClick={onReset}
            disabled={loading}
          >
            Reset
          </button>
        )}
        
        <button 
          className={`${styles.controlButton} ${styles.cancel}`}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        
        {selectedPoints.length === 2 && (
          <button 
            className={`${styles.controlButton} ${styles.calculate}`}
            onClick={onCalculate}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Slice'}
          </button>
        )}
      </div>
      
    </div>
  );
};

export default SliceSelection; 