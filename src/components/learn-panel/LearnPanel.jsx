import React from 'react';
import VectorEmbeddingContent from './content/VectorEmbeddingContent';
import PcaContent from './content/PcaContent';
import DistanceContent from './content/DistanceContent';
import AnalogyContent from './content/AnalogyContent';
import SliceContent from './content/SliceContent';
import styles from './LearnPanel.module.css';

const LearnPanel = ({ activeTool, onClose }) => {
  // Determine which content to show based on the active tool
  const renderContent = () => {
    switch (activeTool) {
      case '2D/3D':
        return <PcaContent />;
      case 'Measure':
        return <DistanceContent />;
      case 'Analogy':
        return <AnalogyContent />;
      case 'Slice':
        return <SliceContent />;
      default:
        return <VectorEmbeddingContent />;
    }
  };

  return (
    <div className={styles.learnPanel}>
      <div className={styles.learnPanelHeader}>
        <h2>Understanding {activeTool || 'Vector Embeddings'}</h2>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        )}
      </div>
      <div className={styles.learnPanelContent}>
        {renderContent()}
      </div>
    </div>
  );
};

export default LearnPanel; 