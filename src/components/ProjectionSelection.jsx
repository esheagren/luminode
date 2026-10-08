import React from 'react';
import './ToolbarStyles.css';
import styles from './ProjectionSelection.module.css';

/**
 * Component displayed during axis projection selection mode.
 * Two-phase selection: first pick 2 axis words, then pick N words to project.
 */
const ProjectionSelection = ({
  selectedPoints,
  onReset,
  onCancel,
  onCalculate,
  loading
}) => {
  const axisComplete = selectedPoints.length >= 2;
  const projectionWords = selectedPoints.slice(2);
  const canCalculate = axisComplete && projectionWords.length > 0;

  return (
    <div className={styles.projectionSelection}>
      <div className={styles.infoText}>
        <p>
          {selectedPoints.length === 0 && (
            "Define a semantic axis: select the first word (the \"from\" direction)."
          )}
          {selectedPoints.length === 1 && (
            "Now select the second axis word (the \"to\" direction)."
          )}
          {axisComplete && projectionWords.length === 0 && (
            `Axis: "${selectedPoints[0]}" → "${selectedPoints[1]}". Now select words to project onto this axis.`
          )}
          {axisComplete && projectionWords.length > 0 && (
            `Axis: "${selectedPoints[0]}" → "${selectedPoints[1]}". ${projectionWords.length} word${projectionWords.length > 1 ? 's' : ''} selected. Add more or click Calculate.`
          )}
        </p>
      </div>

      <div className={styles.selectionInfo}>
        {selectedPoints.length > 0 && (
          <div className={styles.selectedPoints}>
            <div className={`${styles.pointTag} ${styles.projectionAxis}`}>
              <span className={styles.pointLabel}>From:</span>
              <span className={styles.pointValue}>{selectedPoints[0] || "None"}</span>
            </div>

            {selectedPoints.length > 1 && (
              <div className={`${styles.pointTag} ${styles.projectionAxis}`}>
                <span className={styles.pointLabel}>To:</span>
                <span className={styles.pointValue}>{selectedPoints[1]}</span>
              </div>
            )}

            {projectionWords.map((word, i) => (
              <div key={i} className={`${styles.pointTag} ${styles.projectionWord}`}>
                <span className={styles.pointValue}>{word}</span>
              </div>
            ))}
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

        {canCalculate && (
          <button
            className={`${styles.controlButton} ${styles.calculate} ${styles.projection}`}
            onClick={onCalculate}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Projection'}
          </button>
        )}
      </div>

    </div>
  );
};

export default ProjectionSelection;
