import React from 'react';
import './ToolbarStyles.css';
import styles from './MidpointSelection.module.css';

/**
 * Component displayed during midpoint selection mode
 */
const MidpointSelection = ({ 
  selectedPoints = [], 
  onReset, 
  onCancel,
  onCalculate,
  loading = false 
}) => {
  return (
    <div className={`toolbar compact ${styles.compactToolbar}`}>
      <div className="toolbar-inner">
        <div className={styles.selectedPoints}>
          {selectedPoints.length === 0 ? (
            <span className={styles.noPoints}>Click on a point in the visualization to select it.</span>
          ) : (
            <div className={styles.pointList}>
              {selectedPoints.map((word, index) => (
                <div key={index} className="result-item">
                  <span className="result-word">{word}</span>
                </div>
              ))}
              
              {selectedPoints.length < 2 && (
                <span className={styles.pointInstruction}>Click to select {selectedPoints.length === 0 ? 'first' : 'second'} point</span>
              )}
              
              {selectedPoints.length === 2 && loading && (
                <span className={styles.pointInstruction}>Finding midpoint...</span>
              )}
              
              {selectedPoints.length === 2 && !loading && onCalculate && (
                <button 
                  className={`search-btn ${styles.searchBtn} ${styles.calculateBtn}`}
                  onClick={onCalculate}
                  style={{ background: 'rgba(6, 182, 72, 0.2)', color: '#4ada7c', marginLeft: '10px' }}
                >
                  Calculate Midpoint
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.selectionActions}>
          {selectedPoints.length > 0 && (
            <button 
              className={`search-btn ${styles.searchBtn}`}
              onClick={onReset}
              disabled={loading}
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              Reset
            </button>
          )}
          
          <button 
            className={`search-btn ${styles.searchBtn}`}
            onClick={onCancel}
            disabled={loading}
            style={{ background: 'rgba(220, 0, 0, 0.1)', color: '#FF7272' }}
          >
            Cancel
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default MidpointSelection; 