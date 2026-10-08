import React, { useRef, useEffect, useState } from 'react';
import LoadingAnimation from '../visualization/LoadingAnimation';
import Footer from '../Footer';
import { Link } from 'react-router-dom';
import styles from './AboutPage.module.css';

const AboutPage = () => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set initial dimensions
    updateDimensions();
    
    // Add resize listener
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
    <div className={styles.aboutPage} ref={containerRef}>
      <div className={styles.animationBackground}>
        <LoadingAnimation 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      </div>
      
      <div className={styles.content}>
        <div className={styles.headerContainer}>
          <h1>About Luminode</h1>
          <div className={styles.navigationButtons}>
            <Link to="/app" className={styles.navButton}>
              Explore App
            </Link>
            <Link to="/learn" className={styles.navButton}>
              Learn More
            </Link>
          </div>
        </div>
        
        <div className={styles.aboutContainer}>
          <div className={styles.aboutContent}>
            <h2>Vector Database Visualization Software</h2>
            
            <p>
              Luminode is an educational application for exploring word embeddings, finding semantic relationships, 
              and visualizing vector spaces. The application uses cloud-based Pinecone storage for word embeddings 
              to ensure optimal performance.
            </p>
            
            <div className={styles.featuresSection}>
              <h3>Key Features</h3>
              <ul>
                <li>Find similar words using nearest neighbor search</li>
                <li>Calculate semantic midpoints between words to discover concepts in-between</li>
                <li>Solve analogy problems (e.g., "man is to woman as king is to _____")</li>
                <li>Explore semantic space using novel slicing technique</li>
                <li>Visualize word vectors in 2D or 3D space using memory-efficient PCA</li>
              </ul>
            </div>
            
            <div className={styles.techSection}>
              <h3>Technology</h3>
              <p>
                Luminode is built with React and Vite for the frontend, Express.js for the backend API, 
                and uses Pinecone vector database for cloud-based vector storage and search. The application 
                utilizes Llama Text Embed v2 word embeddings (1024-dimensional vectors, generated via Pinecone's integrated inference) and employs memory-optimized PCA
                implementation for visualization with Three.js for 3D rendering.
              </p>
            </div>
            
            <div className={styles.disclaimerSection}>
              <h3>Limitations</h3>
              <p>
                Word embeddings capture semantic relationships based on word co-occurrence patterns in training data,
                but they have limitations. They may reflect societal biases present in the training data and can sometimes
                produce unexpected or inconsistent results. Luminode is designed as an educational tool to help understand
                the concepts of vector embeddings rather than as a definitive resource for language understanding.
              </p>
            </div>
          </div>
        </div>
        
        <div className={styles.bottomNavigation}>
          <Link to="/" className={styles.homeButton}>
            Return to Home
          </Link>
        </div>
      </div>
      
      <Footer />
      
    </div>
  );
};

export default AboutPage; 