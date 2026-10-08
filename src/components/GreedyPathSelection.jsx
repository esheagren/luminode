import React from 'react';
import './ToolbarStyles.css';
import styles from './GreedyPathSelection.module.css';

/**
 * Component displayed during greedy path selection mode
 */
const GreedyPathSelection = ({
  selectedPoints,
  onReset,
  onCancel,
  onCalculate,
  loading
}) => {
  return (
    <div className={styles.greedyPathSelection}>
      <div className={styles.infoText}>
        <p>
          {selectedPoints.length === 0 && (
            "Select two points to find a path hopping through semantic neighbors toward the target."
          )}
          {selectedPoints.length === 1 && (
            "Now select the target point to complete the greedy path."
          )}
          {selectedPoints.length === 2 && (
            `Ready to calculate greedy path from "${selectedPoints[0]}" to "${selectedPoints[1]}".`
          )}
        </p>
      </div>

      <div className={styles.selectionInfo}>
        {selectedPoints.length > 0 && (
          <div className={styles.selectedPoints}>
            <div className={`${styles.pointTag} ${styles.greedyPath}`}>
              <span className={styles.pointLabel}>Start:</span>
              <span className={styles.pointValue}>{selectedPoints[0] || "None"}</span>
            </div>

            {selectedPoints.length > 1 && (
              <div className={`${styles.pointTag} ${styles.greedyPath}`}>
                <span className={styles.pointLabel}>Target:</span>
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
            className={`${styles.controlButton} ${styles.calculate} ${styles.greedyPath}`}
            onClick={onCalculate}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Greedy Path'}
          </button>
        )}
      </div>

    </div>
  );
};

export default GreedyPathSelection;
