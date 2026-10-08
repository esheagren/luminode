import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ViewButton from './ViewButton';
import VectorGraph2D from './visualization/VectorGraph2D';
import VectorGraph3D from './visualization/VectorGraph3D';
import LoadingOverlay from './visualization/LoadingOverlay';
import ErrorOverlay from './visualization/ErrorOverlay';
import { getApiUrl } from '../utils/environment';
import styles from './VectorGraph.module.css';

const VectorGraph = ({ 
  words, 
  midpointWords, 
  numMidpoints, 
  viewMode = '2D', 
  rulerActive,
  selectionMode = false,
  onPointSelected = null,
  selectedPoints = [],
  analogyMode = false,
  analogyStep = 0,
  isSearchingAnalogy = false
}) => {
  const [coordinates, setCoordinates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Fetch coordinates when words or viewMode changes
  useEffect(() => {
    if (!words || words.length === 0) {
      // Clear coordinates when there are no words
      setCoordinates([]);
      return;
    }
    
    const fetchCoordinates = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Create array of all words to visualize
        const allWords = [...words];
        
        // Add related words if available
        const hasRelatedWords = midpointWords && midpointWords.length > 0;
        
        if (hasRelatedWords) {
          // Add all words from all clusters
          midpointWords.forEach(cluster => {
            if (cluster && cluster.words) {
              allWords.push(...cluster.words.map(item => item.word));
            }
          });
        }
        
        // Make sure we have unique words only
        const uniqueWords = [...new Set(allWords)];
        
        
        // Get the vector coordinates for visualization
        const apiUrl = getApiUrl('/api/getVectorCoordinates');
        
        const response = await axios.post(apiUrl, { 
          words: uniqueWords,
          dimensions: viewMode === '3D' ? 3 : 2,
          includeMeasureVectors: rulerActive
        });
        


        
        // Combine coordinate data with cluster info (vector data is already in response.data.data)
        const coordinatesWithDetails = response.data.data.map(point => {
          // The point object from the API already contains:
          // word, x, y, [z], truncatedVector
          
          // Check if this point is part of an analogy result
          const analogyCluster = midpointWords.find(cluster => 
            cluster.type === 'analogy' && 
            cluster.words.some(w => w.word === point.word)
          );
          
          let isAnalogy = false;
          let analogySource = null;
          
          if (analogyCluster) {
            const analogyWord = analogyCluster.words.find(w => w.word === point.word);
            isAnalogy = !!analogyWord?.isAnalogy;
            analogySource = analogyWord?.analogySource || null;
          }
          
          // Check if this point is part of a midpoint result
          const midpointCluster = midpointWords.find(cluster => 
            cluster.type === 'midpoint' && 
            cluster.words.some(w => w.word === point.word)
          );
          
          let isMidpoint = false;
          let midpointLevel = null;
          let midpointSource = null;
          
          if (midpointCluster) {
            const midpointWord = midpointCluster.words.find(w => w.word === point.word);
            isMidpoint = !!midpointWord?.isMidpoint;
            midpointLevel = midpointWord?.midpointLevel || 'primary';
            midpointSource = midpointWord?.midpointSource || null;
            
          }
          
          // Check if this point is part of a slice result
          const sliceCluster = midpointWords.find(cluster => 
            cluster.type === 'slice' && 
            cluster.words.some(w => w.word === point.word)
          );
          
          let isSlice = false;
          let isMainPoint = false;
          let isEndpoint = false;
          let sliceLevel = null;
          let sliceIndex = null;
          let sliceDepth = null;
          let sliceSource = null;
          let similarity = null;
          let distance = null;
          
          if (sliceCluster) {
            const sliceWord = sliceCluster.words.find(w => w.word === point.word);
            if (sliceWord) {
              isSlice = !!sliceWord.isSlice;
              isMainPoint = !!sliceWord.isMainPoint;
              isEndpoint = !!sliceWord.isEndpoint;
              sliceLevel = sliceWord.sliceLevel || 'neighbor';
              sliceIndex = sliceWord.sliceIndex || 0;
              sliceDepth = sliceWord.sliceDepth || 0;
              sliceSource = sliceWord.sliceSource || null;
              similarity = sliceWord.similarity || null;
              distance = sliceWord.distance || null;

            }
          }

          // Check if this point is part of a linear path result
          const linearPathCluster = midpointWords.find(cluster =>
            cluster.type === 'linearPath' &&
            cluster.words.some(w => w.word === point.word)
          );

          let isLinearPath = false;
          let linearPathIndex = null;
          let linearPathEndpoint = false;

          if (linearPathCluster) {
            const linearPathWord = linearPathCluster.words.find(w => w.word === point.word);
            if (linearPathWord) {
              isLinearPath = !!linearPathWord.isLinearPath;
              linearPathIndex = linearPathWord.pathIndex;
              linearPathEndpoint = !!linearPathWord.isEndpoint;

            }
          }

          // Check if this point is part of a greedy path result
          const greedyPathCluster = midpointWords.find(cluster =>
            cluster.type === 'greedyPath' &&
            cluster.words.some(w => w.word === point.word)
          );

          let isGreedyPath = false;
          let greedyPathIndex = null;
          let greedyPathEndpoint = false;

          if (greedyPathCluster) {
            const greedyPathWord = greedyPathCluster.words.find(w => w.word === point.word);
            if (greedyPathWord) {
              isGreedyPath = !!greedyPathWord.isGreedyPath;
              greedyPathIndex = greedyPathWord.pathIndex;
              greedyPathEndpoint = !!greedyPathWord.isEndpoint;

            }
          }

          // Check if this point is part of an axis projection result
          const axisProjectionCluster = midpointWords.find(cluster =>
            cluster.type === 'axisProjection' &&
            cluster.words.some(w => w.word === point.word)
          );

          let isAxisProjection = false;
          let axisProjectionEndpoint = false;
          let projectionPosition = null;
          let perpendicularDistance = null;

          if (axisProjectionCluster) {
            const projWord = axisProjectionCluster.words.find(w => w.word === point.word);
            if (projWord) {
              isAxisProjection = !!projWord.isAxisProjection;
              axisProjectionEndpoint = !!projWord.isEndpoint;
              projectionPosition = projWord.position;
              perpendicularDistance = projWord.perpendicularDistance;

            }
          }

          return {
            ...point, // Includes word, x, y, [z], truncatedVector from API
            isAnalogy,
            analogySource,
            isMidpoint,
            midpointLevel,
            midpointSource,
            isSlice,
            isMainPoint,
            isEndpoint: isEndpoint || linearPathEndpoint || greedyPathEndpoint || axisProjectionEndpoint,
            sliceLevel,
            sliceIndex,
            sliceDepth,
            sliceSource,
            similarity,
            distance,
            isLinearPath,
            pathIndex: linearPathIndex ?? greedyPathIndex,
            isGreedyPath,
            isAxisProjection,
            projectionPosition,
            perpendicularDistance
          };
        });
        
        // Debug the coordinates data after processing
        
        setCoordinates(coordinatesWithDetails);
      } catch (error) {
        console.error('Error fetching vector coordinates:', error);
        setError('Failed to load visualization data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoordinates();
  }, [words, viewMode, midpointWords, numMidpoints, rulerActive]);
  
  // Handle point selection
  const handlePointSelected = (word) => {
    if (onPointSelected) {
      onPointSelected(word);
    }
  };
  
  // Add transition animation when switching view modes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Add transition effect
    canvasRef.current.style.transition = 'transform 0.5s ease-in-out, opacity 0.3s ease-in-out';
    
    // Apply animation
    if (viewMode === '3D') {
      // Animate to 3D
      canvasRef.current.style.opacity = '0';
      setTimeout(() => {
        canvasRef.current.style.transform = 'rotateY(180deg)';
        setTimeout(() => {
          canvasRef.current.style.opacity = '1';
          canvasRef.current.style.transform = 'rotateY(0deg)';
        }, 300);
      }, 300);
    } else {
      // Animate to 2D
      canvasRef.current.style.opacity = '0';
      setTimeout(() => {
        canvasRef.current.style.transform = 'rotateX(180deg)';
        setTimeout(() => {
          canvasRef.current.style.opacity = '1';
          canvasRef.current.style.transform = 'rotateX(0deg)';
        }, 300);
      }, 300);
    }
  }, [viewMode]);

  return (
    <div className={styles.graphContainer} ref={containerRef}>
      {loading && <LoadingOverlay />}
      
      {error && <ErrorOverlay error={error} />}
      
      <div ref={canvasRef}>
        {viewMode === '2D' ? (
          <VectorGraph2D 
            coordinates={coordinates} 
            words={words} 
            containerRef={containerRef}
            rulerActive={rulerActive}
            selectionMode={selectionMode}
            onPointSelected={handlePointSelected}
            selectedPoints={selectedPoints}
            analogyMode={analogyMode}
            analogyStep={analogyStep}
            isSearchingAnalogy={isSearchingAnalogy}
          />
        ) : (
          <VectorGraph3D 
            coordinates={coordinates} 
            words={words} 
            containerRef={containerRef}
            rulerActive={rulerActive}
          />
        )}
      </div>
      
    </div>
  );
};

export default VectorGraph;
