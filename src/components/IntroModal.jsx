import React from 'react';
import styles from './IntroModal.module.css';

const IntroModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className={styles.introModalOverlay} onClick={onClose}>
      <div className={styles.introModalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.introModalHeader}>
          <h2>Welcome to Luminode</h2>
          <button className={styles.introCloseButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.introModalBody}>
          <h3>Vector Embeddings: The Heart of Modern AI</h3>
          
          <p>
            Vector embeddings are a <strong>core technology</strong> at the heart of modern AI systems, enabling machines to represent 
            meaning algorithmically. Unlike traditional dictionary definitions, which provide fixed meanings, 
            vectors capture how words are used <strong>relationally</strong>, how they are used <strong>in context</strong>.
          </p>
          
          <p>
            Vector embeddings are <strong>high-dimensional matrices</strong>. Imagine a familiar X-Y plane, then an X-Y-Z plane, and then imagine you continue increasing the number of dimensions to hundreds or even thousands of dimensions, each capturing a subtle semantic nuance, like if the word is a plural, is gendered, or even is associated with witchcraft. In high-dimensional systems, surprising layers of abstraction are often represented and can be seen visually.
          </p>
          
          <div className={styles.introGraphic}>
            <div className={styles.vectorSpace}>
              
              <div className={`${styles.dimensionsLabel} ${styles.zLabel}`}>(...1000+ more dimensions)</div>
              <div className={`${styles.point} p1`} style={{ left: '25%', top: '30%' }}>
                <span className={styles.label}>king</span>
              </div>
              <div className={`${styles.point} p2`} style={{ left: '45%', top: '45%' }}>
                <span className={styles.label}>queen</span>
              </div>
              <div className={`${styles.point} p3`} style={{ left: '30%', top: '65%' }}>
                <span className={styles.label}>man</span>
              </div>
              <div className={`${styles.point} p4`} style={{ left: '50%', top: '75%' }}>
                <span className={styles.label}>woman</span>
              </div>
              <div className={`${styles.connector} ${styles.c1}`}></div>
              <div className={`${styles.connector} ${styles.c2}`}></div>
            </div>
          </div>
          
          <div className={styles.introSection}>
            <h4>Key Concepts</h4>
            <div className={styles.conceptList}>
              <div className={styles.conceptItem}>
                <strong>Context is Meaning:</strong> Words gain meaning from their context, not fixed definitions
              </div>
              <div className={styles.conceptItem}>
                <strong>Proximity = Similarity:</strong> Words with similar contexts cluster together in vector space
              </div>
              <div className={styles.conceptItem}>
                <strong>Direction = Relationship:</strong> The direction between vectors captures semantic relationships
              </div>
              <div className={styles.conceptItem}>
                <strong>Vector Arithmetic:</strong> Operations like "king - man + woman = queen" reveal embedded patterns
              </div>
            </div>
          </div>
          
          <div className={styles.introSection}>
            <h4>Applications</h4>
            <p>
              These mathematical representations form the foundation of:
            </p>
            <div className={styles.conceptList}>
              <div className={styles.conceptItem}>Large language models (ChatGPT, Claude, etc.)</div>
              <div className={styles.conceptItem}>Search engines that understand meaning beyond keywords</div>
              <div className={styles.conceptItem}>Recommendation systems that discover hidden connections</div>
              <div className={styles.conceptItem}>Translation systems that preserve semantic relationships</div>
            </div>
          </div>
          
          <div className={styles.introSection}>
            <h4>Luminode's Tools</h4>
            <p>
              This application allows you to:
            </p>
            <div className={styles.conceptList}>
              <div className={styles.conceptItem}><strong>Visualize:</strong> See word relationships in 2D/3D space</div>
              <div className={styles.conceptItem}><strong>Find Neighbors:</strong> Discover semantically similar words and concepts</div>
              <div className={styles.conceptItem}><strong>Explore Analogies:</strong> Perform vector arithmetic to find word relationships</div>
            </div>
          </div>
          
          <div className={styles.introActions}>
            <button className={`${styles.introButton} ${styles.primary}`} onClick={onClose}>Start Exploring</button>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default IntroModal; 