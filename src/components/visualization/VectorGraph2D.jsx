import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createTooltip, removeTooltip, createSimilarityTooltip } from './VectorTooltip';
import { getPointColor, calculateCosineSimilarity, formatSimilarity } from './VectorUtils';
import SimpleLoadingAnimation from './SimpleLoadingAnimation';
import drawAnalogyProjection from './AnalogyProjection';
import styles from './VectorGraph2D.module.css';

const VectorGraph2D = ({
  coordinates,
  words,
  containerRef,
  rulerActive,
  selectionMode = false,
  onPointSelected = null,
  selectedPoints = [],
  analogyMode = false,
  analogyStep = 0,
  isSearchingAnalogy = false
}) => {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const similarityLabelsRef = useRef([]); // hit-areas of the ruler similarity labels, for hover/click
  const [isLoading, setIsLoading] = useState(true);
  const animationFrameRef = useRef(null);
  const touchStartRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [pinnedPoint, setPinnedPoint] = useState(null);

  // Clear pinned point when coordinates change to avoid stale data
  useEffect(() => {
    setPinnedPoint(null);
  }, [coordinates]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Cancel animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Animation function for the analogy projection
  const animateAnalogyProjection = useCallback(() => {
    if (!canvasRef.current || !pointsRef.current.length) {
      return;
    }
    
    if (!isSearchingAnalogy || analogyStep !== 3) {
      return;
    }
    
    if (selectedPoints.length < 3) {
      return;
    }
    
    // Get the points needed for the projection
    const points = pointsRef.current;
    const sourcePoint = points.find(p => p.word === selectedPoints[2]);
    const point1 = points.find(p => p.word === selectedPoints[0]);
    const point2 = points.find(p => p.word === selectedPoints[1]);
    
    if (!sourcePoint || !point1 || !point2) {
      return;
    }
    
    // Draw the visualization
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Redraw the full visualization to avoid artifacts
    drawVisualization(coordinates);
    
    // Draw the analogy projection with the current timestamp for animation
    const timestamp = performance.now();
    drawAnalogyProjection(sourcePoint, point1, point2, ctx, timestamp);
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animateAnalogyProjection);
  }, [isSearchingAnalogy, analogyStep, selectedPoints, coordinates]);
  
  // Start or stop projection animation when search state changes
  useEffect(() => {
    
    if (isSearchingAnalogy && analogyStep === 3) {
      animationFrameRef.current = requestAnimationFrame(animateAnalogyProjection);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isSearchingAnalogy, analogyStep, animateAnalogyProjection, selectedPoints]);
  
  useEffect(() => {
    setIsLoading(coordinates.length === 0);
    
    const resizeCanvas = () => {
      if (!containerRef.current || !canvasRef.current) {
        return;
      }
      
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      
      // Resize 2D canvas with explicit dimensions
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
      
      // Redraw visualization if we have coordinates
      if (coordinates.length > 0) {
        // Filter out coordinates with isAnalogy = true to put them on top
        const regularCoords = coordinates.filter(coord => !coord.isAnalogy);
        const analogyCoords = coordinates.filter(coord => coord.isAnalogy);
        
        // Sort coordinates so that analogy results are processed last (drawn on top)
        const sortedCoordinates = [...regularCoords, ...analogyCoords];
        
        drawVisualization(sortedCoordinates);
        setIsLoading(false);
      } else {
        setIsLoading(false); // Changed from true to false to avoid showing loading animation
        
        // Draw empty state with visible background
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Clear the entire canvas
          ctx.fillStyle = '#1a1a2e'; // Dark blue background
          ctx.fillRect(0, 0, width, height);
          // Reset any stored point data
          pointsRef.current = [];
          similarityLabelsRef.current = [];
        }
      }
    };
    
    // Initial resize
    resizeCanvas();
    
    // Add resize event listener
    window.addEventListener('resize', resizeCanvas);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [coordinates, containerRef, rulerActive, selectedPoints, selectionMode, analogyMode, analogyStep, isSearchingAnalogy, isMobile]);
  
  const drawVisualization = (coordsToRender = coordinates) => {
    if (!coordsToRender.length || !canvasRef.current) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return;
    }
    
    
    // Clear the canvas with a visible background color
    ctx.fillStyle = '#1a1a2e'; // Dark blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Find min/max values to scale the plot
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    coordsToRender.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
    
    // Add padding
    const padding = 120;
    const plotWidth = canvas.width - (padding * 2);
    const plotHeight = canvas.height - (padding * 2);
    
    // Scale function to map coordinates to canvas
    const scaleX = (x) => padding + ((x - minX) / (maxX - minX)) * plotWidth;
    const scaleY = (y) => padding + ((y - minY) / (maxY - minY)) * plotHeight;
    
    // Draw points
    pointsRef.current = [];
    
    coordsToRender.forEach(point => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      const isPrimary = words.includes(point.word);
      const isContextSample = point.isContextSample === true;
      const isAnalogy = point.isAnalogy === true;
      const isSelected = selectedPoints.includes(point.word);
      
      
      // Determine radius based on point type
      // Increase radius by 1.3x on mobile for easier touch selection
      const mobileMultiplier = isMobile ? 1.3 : 1;
      let radius;
      if (isPrimary) {
        radius = 8 * mobileMultiplier; // Primary words (user input)
      } else if (isAnalogy) {
        radius = 7 * mobileMultiplier; // Analogy results (slightly larger than related)
      } else if (isContextSample) {
        radius = 3 * mobileMultiplier; // Context sample words (smaller)
      } else {
        radius = 5 * mobileMultiplier; // Related words
      }
      
      // Store point info for interaction
      pointsRef.current.push({
        ...point,
        x,
        y,
        radius,
        isPrimary,
        isContextSample,
        isAnalogy,
        isSelected
      });
      
      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = getPointColor(
        point.word,
        words,
        isPrimary,
        isContextSample,
        isAnalogy,
        point.isSlice,
        point.isMainPoint,
        point.isEndpoint,
        point.sliceLevel,
        point.isLinearPath,
        point.isGreedyPath,
        point.isAxisProjection
      );
      ctx.fill();
      
      // Add highlight for selected points
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#4285F4';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw label only for primary words, analogy results, and related words (not context samples)
      if (!isContextSample || isPrimary || isAnalogy) {
        ctx.font = isPrimary ? 'bold 14px Arial' : (isAnalogy ? 'bold 13px Arial' : '12px Arial');
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(point.word, x, y - radius - 5);
      }
    });
    
    // After drawing all points, draw ruler lines if active
    if (rulerActive && words.length >= 2) {
      drawRulerLines(ctx, pointsRef.current);
    }

    // Draw slice progression lines if slice points exist
    drawSliceLines(ctx, pointsRef.current);

    // Draw linear path lines if linear path points exist
    drawLinearPathLines(ctx, pointsRef.current);

    // Draw greedy path lines if greedy path points exist
    drawGreedyPathLines(ctx, pointsRef.current);

    // Draw axis projection lines if axis projection points exist
    drawAxisProjectionLines(ctx, pointsRef.current);

    // Draw analogy selection lines if in analogy mode
    if (analogyMode && selectedPoints.length > 0) {
      drawAnalogySelectionLines(ctx, pointsRef.current, selectedPoints);
    }
    // Only draw analogy result lines if not in active selection mode
    else if (!analogyMode && !selectionMode) {
      drawAnalogyLines(ctx, pointsRef.current);
    }
    
    // Draw midpoint lines when midpoints exist 
    drawMidpointLines(ctx, pointsRef.current);
    
    // Display selection mode indicator if active
    if (selectionMode && !analogyMode) {
      const message = `Selection Mode: Click on a word to select (${selectedPoints.length}/2)`;
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#4285F4';
      ctx.textAlign = 'center';
      ctx.fillText(message, canvas.width / 2, 30);
    }
    else if (analogyMode) {
      const message = `Analogy Mode: Step ${analogyStep + 1}`;
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#FF8008';
      ctx.textAlign = 'center';
      ctx.fillText(message, canvas.width / 2, 30);
    }
  };
  
  // Function to draw ruler lines between points
  const drawRulerLines = (ctx, points) => {
    // Find primary words (words from the user input)
    const primaryPoints = points.filter(point => point.isPrimary);
    
    // Early return if we don't have enough points
    if (primaryPoints.length < 2) return;
    
    // Vector extraction - only use actual embedding vectors, never synthetic coordinates
    const extractVector = (vecStr, point) => {
      // First try to use the measureVector if available (most accurate - full embedding)
      if (point && point.measureVector && Array.isArray(point.measureVector)) {
        return point.measureVector;
      }

      // Try to use vectors array if available
      if (point && point.vectors && Array.isArray(point.vectors)) {
        return point.vectors;
      }

      // Use fullVector if available (complete embedding)
      if (point && point.fullVector && Array.isArray(point.fullVector)) {
        return point.fullVector;
      }

      // If it's already an array, use it directly
      if (Array.isArray(vecStr)) {
        return vecStr;
      }

      // Try to parse from string format - but only if it looks like a complete vector
      if (typeof vecStr === 'string') {
        // Skip truncated vectors (containing "...")
        if (vecStr.includes('...')) {
          return null;
        }

        // Try to extract complete array content
        const matches = vecStr.match(/\[(.*?)\]/);
        if (matches && matches[1]) {
          try {
            const values = matches[1].split(/[,\s]+/).map(num => parseFloat(num.trim()));
            // Only use if we have a reasonable number of dimensions (at least 50)
            if (values.length >= 50 && values.every(v => !isNaN(v))) {
              return values;
            }
          } catch {
            // Parsing failed, return null
          }
        }
      }

      // No valid vector found - return null rather than using misleading synthetic data
      // This will cause the similarity to display as "N/A" which is more honest
      return null;
    };
    
    // Store similarity labels for hover detection
    const similarityLabels = [];

    // Draw lines between each pair of primary points
    for (let i = 0; i < primaryPoints.length; i++) {
      for (let j = i + 1; j < primaryPoints.length; j++) {
        const point1 = primaryPoints[i];
        const point2 = primaryPoints[j];
        
        // Debug point info
        
        // Draw line between points
        ctx.beginPath();
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid line
        
        // Calculate distance between points for label
        // Extract vectors from truncatedVector property
        const vec1 = extractVector(point1.truncatedVector, point1);
        const vec2 = extractVector(point2.truncatedVector, point2);
        
        // Calculate similarity only if we have valid vectors
        let distance = null;
        if (vec1 && vec2) {
          distance = calculateCosineSimilarity(vec1, vec2);
        }
        
        // Draw distance label at midpoint of line
        const midX = (point1.x + point2.x) / 2;
        const midY = (point1.y + point2.y) / 2;
        
        // Add background for better readability
        const distText = formatSimilarity(distance);
        const textWidth = ctx.measureText(distText).width;
        
        // Background with a slight highlight to indicate interactivity
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const labelWidth = textWidth + 10;
        const labelHeight = 20;
        const labelX = midX - labelWidth / 2;
        const labelY = midY - 10;
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        
        // Add slight border to indicate interactivity
        ctx.strokeStyle = 'rgba(66, 133, 244, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
        
        // Draw text
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(distText, midX, midY);
        
        // Store label information for hover detection
        similarityLabels.push({
          x: labelX,
          y: labelY,
          width: labelWidth,
          height: labelHeight,
          similarity: distText,
          words: [point1.word, point2.word]
        });
      }
    }
    
    // Store the similarity labels in a ref to access in mouse events
    similarityLabelsRef.current = similarityLabels;
  };
  
  // Function to draw analogy lines between points
  const drawAnalogyLines = (ctx, points) => {
    // Find primary words and analogy points
    const primaryPoints = points.filter(point => point.isPrimary);
    const analogyPoints = points.filter(point => point.isAnalogy);
    
    // Early return if no analogy points
    if (analogyPoints.length === 0) return;
    
    // If we have an analogy result like "man:woman::king:queen"
    // First draw a line between the first two words (man-woman)
    if (primaryPoints.length >= 2) {
      const point1 = primaryPoints[0]; // man
      const point2 = primaryPoints[1]; // woman
      
      ctx.beginPath();
      ctx.moveTo(point1.x, point1.y);
      ctx.lineTo(point2.x, point2.y);
      ctx.strokeStyle = 'rgba(156, 39, 176, 0.8)'; // Solid purple for first analogy pair
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add small lines at the end of the first pair to indicate direction
      const angle1 = Math.atan2(point2.y - point1.y, point2.x - point1.x);
      const arrowSize = 8;
      
      // Arrow at destination (woman)
      const arrowX1 = point2.x - Math.cos(angle1) * (point2.radius + 2);
      const arrowY1 = point2.y - Math.sin(angle1) * (point2.radius + 2);
      
      ctx.beginPath();
      ctx.moveTo(
        arrowX1 - Math.cos(angle1 - Math.PI/6) * arrowSize,
        arrowY1 - Math.sin(angle1 - Math.PI/6) * arrowSize
      );
      ctx.lineTo(arrowX1, arrowY1);
      ctx.lineTo(
        arrowX1 - Math.cos(angle1 + Math.PI/6) * arrowSize,
        arrowY1 - Math.sin(angle1 + Math.PI/6) * arrowSize
      );
      ctx.fillStyle = 'rgba(156, 39, 176, 0.8)';
      ctx.fill();
    }
    
    // Then if we have a third word (king) and at least one analogy result (queen)
    if (primaryPoints.length >= 3 && analogyPoints.length > 0) {
      const point3 = primaryPoints[2]; // king
      const arrowSize = 8;
      
      // Find the "best" analogy result (highest score)
      const bestAnalogy = analogyPoints.reduce(
        (best, current) => (!best || (current.score > best.score) ? current : best), 
        null
      );
      
      if (bestAnalogy) {
        // Draw line from king to queen
        ctx.beginPath();
        ctx.moveTo(point3.x, point3.y);
        ctx.lineTo(bestAnalogy.x, bestAnalogy.y);
        ctx.strokeStyle = 'rgba(156, 39, 176, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Arrow at destination (queen)
        const angle2 = Math.atan2(bestAnalogy.y - point3.y, bestAnalogy.x - point3.x);
        const arrowX2 = bestAnalogy.x - Math.cos(angle2) * (bestAnalogy.radius + 2);
        const arrowY2 = bestAnalogy.y - Math.sin(angle2) * (bestAnalogy.radius + 2);
        
        ctx.beginPath();
        ctx.moveTo(
          arrowX2 - Math.cos(angle2 - Math.PI/6) * arrowSize,
          arrowY2 - Math.sin(angle2 - Math.PI/6) * arrowSize
        );
        ctx.lineTo(arrowX2, arrowY2);
        ctx.lineTo(
          arrowX2 - Math.cos(angle2 + Math.PI/6) * arrowSize,
          arrowY2 - Math.sin(angle2 + Math.PI/6) * arrowSize
        );
        ctx.fillStyle = 'rgba(156, 39, 176, 0.8)';
        ctx.fill();
      }
      
      // If we have a best analogy result, draw a dashed line between the two relationships
      if (analogyPoints.length > 0) {
        const bestAnalogy = analogyPoints.reduce(
          (best, current) => (!best || (current.score > best.score) ? current : best), 
          null
        );
        
        if (bestAnalogy && primaryPoints[0] && primaryPoints[1] && primaryPoints[2]) {
          const midpoint1 = {
            x: (primaryPoints[0].x + primaryPoints[1].x) / 2,
            y: (primaryPoints[0].y + primaryPoints[1].y) / 2
          };
          
          const midpoint2 = {
            x: (primaryPoints[2].x + bestAnalogy.x) / 2,
            y: (primaryPoints[2].y + bestAnalogy.y) / 2
          };
          
          // Draw dashed connecting line between the two analogies
          ctx.beginPath();
          ctx.moveTo(midpoint1.x, midpoint1.y);
          ctx.lineTo(midpoint2.x, midpoint2.y);
          ctx.strokeStyle = 'rgba(156, 39, 176, 0.5)'; // Translucent purple
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]); // Dashed line to show relationship
          ctx.stroke();
          ctx.setLineDash([]); // Reset to solid line
        }
      }
    }
  };
  
  // Function to draw midpoint lines between points
  const drawMidpointLines = (ctx, points) => {
    // Find midpoint points
    const midpointPoints = points.filter(point => point.isMidpoint);
    
    // Debug midpoint points
    
    // Early return if no midpoint points
    if (midpointPoints.length === 0) {
      return;
    }
    
    // Draw connections for each midpoint point
    midpointPoints.forEach(midpointPoint => {
      if (!midpointPoint.midpointSource || !midpointPoint.midpointSource.fromWords) {
        return;
      }
      
      // Only draw lines for primary results (the closest word to the theoretical midpoint)
      if (!midpointPoint.midpointSource.isPrimaryResult) return;
      
      // Get the source words that this midpoint is between
      const [word1, word2] = midpointPoint.midpointSource.fromWords;
      
      // Find the points for these words
      const sourcePoint1 = points.find(p => p.word === word1);
      const sourcePoint2 = points.find(p => p.word === word2);
      
      if (!sourcePoint1 || !sourcePoint2) return;
      
      // Draw line from source1 to midpoint
      ctx.beginPath();
      ctx.moveTo(sourcePoint1.x, sourcePoint1.y);
      ctx.lineTo(midpointPoint.x, midpointPoint.y);
      
      // Use different colors based on midpoint level
      let lineColor;
      if (midpointPoint.midpointLevel === 'primary') {
        lineColor = 'rgba(52, 168, 83, 0.6)'; // Green for primary midpoints
      } else if (midpointPoint.midpointLevel === 'secondary') {
        lineColor = 'rgba(66, 133, 244, 0.6)'; // Blue for secondary midpoints
      } else {
        lineColor = 'rgba(251, 188, 5, 0.6)'; // Yellow for tertiary midpoints
      }
      
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]); // Dashed line
      ctx.stroke();
      
      // Draw line from midpoint to source2
      ctx.beginPath();
      ctx.moveTo(midpointPoint.x, midpointPoint.y);
      ctx.lineTo(sourcePoint2.x, sourcePoint2.y);
      ctx.stroke();
      ctx.setLineDash([]); // Reset to solid line
      
      // Add a small circle at the theoretical midpoint position (if we had coordinates)
      // This is just a visual indicator of where the true midpoint would be
      if (midpointPoint.midpointSource.theoreticalMidpoint) {
        // We don't have actual coordinates for the theoretical midpoint
        // So we'll just place it at the midpoint of the line between source1 and source2
        const theoreticalX = (sourcePoint1.x + sourcePoint2.x) / 2;
        const theoreticalY = (sourcePoint1.y + sourcePoint2.y) / 2;
        
        ctx.beginPath();
        ctx.arc(theoreticalX, theoreticalY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
        
        // Draw a dotted line from theoretical midpoint to the actual nearest word
        ctx.beginPath();
        ctx.moveTo(theoreticalX, theoreticalY);
        ctx.lineTo(midpointPoint.x, midpointPoint.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([2, 2]); // Fine dotted line
        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid line
      }
    });
  };
  
  // Function to draw slice progression lines showing the path through the vector space
  const drawSliceLines = (ctx, points) => {
    // Find all slice points
    const slicePoints = points.filter(point => point.isSlice);
    
    // If there are not enough points for a path, return
    if (slicePoints.length < 2) return;
    
    // Separate endpoints and intermediate points
    const startPoint = slicePoints.find(p => p.sliceIndex === 0);
    const endPoint = slicePoints.find(p => p.sliceIndex === 1);
    const intermediatePoints = slicePoints.filter(p => p.sliceIndex > 1);
    
    // We need at least the start and end points
    if (!startPoint || !endPoint) {
      return; // Cannot draw path without endpoints
    }
    
    // Sort ONLY the intermediate points by index
    intermediatePoints.sort((a, b) => a.sliceIndex - b.sliceIndex);
    
    // Start drawing the path
    ctx.beginPath();
    // Move to the start point
    ctx.moveTo(startPoint.x, startPoint.y);
    
    // Create gradient path (optional, but nice)
    const gradient = ctx.createLinearGradient(
      startPoint.x, startPoint.y, 
      endPoint.x, endPoint.y
    );
    gradient.addColorStop(0, '#8E44AD');    // Start with deeper purple
    gradient.addColorStop(1, '#9B59B6');    // End with medium purple
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    
    // Draw lines through all intermediate points in sorted order
    for (const intermediatePoint of intermediatePoints) {
      ctx.lineTo(intermediatePoint.x, intermediatePoint.y);
    }
    
    // Finally, draw the line to the end point
    ctx.lineTo(endPoint.x, endPoint.y);
    
    // Render the complete path
    ctx.stroke();
    
    // --- Draw Arrows --- 
    // Create the full path sequence for arrow calculation
    const fullPath = [startPoint, ...intermediatePoints, endPoint];

    // Add direction arrows along the path segments
    for (let i = 1; i < fullPath.length; i++) {
      const start = fullPath[i - 1];
      const end = fullPath[i];
      
      // Calculate direction vector
      const dirX = end.x - start.x;
      const dirY = end.y - start.y;
      const length = Math.sqrt(dirX * dirX + dirY * dirY);
      
      // Normalize direction vector
      const normDirX = dirX / length;
      const normDirY = dirY / length;
      
      // Calculate position 70% along the line
      const arrowX = start.x + normDirX * length * 0.7;
      const arrowY = start.y + normDirY * length * 0.7;
      
      // Draw arrow
      const arrowSize = 5;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * (normDirX + normDirY * 0.5),
        arrowY - arrowSize * (normDirY - normDirX * 0.5)
      );
      ctx.lineTo(
        arrowX - arrowSize * (normDirX - normDirY * 0.5),
        arrowY - arrowSize * (normDirY + normDirX * 0.5)
      );
      ctx.closePath();
      ctx.fillStyle = '#9B59B6';
      ctx.fill();
    }
  };

  // Function to draw linear path lines - straight line through evenly spaced points
  const drawLinearPathLines = (ctx, points) => {
    // Find all linear path points
    const linearPathPoints = points.filter(point => point.isLinearPath);

    // If there are not enough points for a path, return
    if (linearPathPoints.length < 2) return;

    // Sort by pathIndex
    linearPathPoints.sort((a, b) => a.pathIndex - b.pathIndex);

    // Start drawing the path
    ctx.beginPath();
    ctx.moveTo(linearPathPoints[0].x, linearPathPoints[0].y);

    // Create gradient path
    const startPoint = linearPathPoints[0];
    const endPoint = linearPathPoints[linearPathPoints.length - 1];

    const gradient = ctx.createLinearGradient(
      startPoint.x, startPoint.y,
      endPoint.x, endPoint.y
    );
    gradient.addColorStop(0, '#2196F3');    // Start with deep blue
    gradient.addColorStop(1, '#64B5F6');    // End with light blue

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;

    // Draw lines through all points in sorted order
    for (let i = 1; i < linearPathPoints.length; i++) {
      ctx.lineTo(linearPathPoints[i].x, linearPathPoints[i].y);
    }

    // Render the complete path
    ctx.stroke();

    // Add direction arrows along the path segments
    for (let i = 1; i < linearPathPoints.length; i++) {
      const start = linearPathPoints[i - 1];
      const end = linearPathPoints[i];

      // Calculate direction vector
      const dirX = end.x - start.x;
      const dirY = end.y - start.y;
      const length = Math.sqrt(dirX * dirX + dirY * dirY);

      if (length < 20) continue; // Skip arrows for short segments

      // Normalize direction vector
      const normDirX = dirX / length;
      const normDirY = dirY / length;

      // Calculate position 70% along the line
      const arrowX = start.x + normDirX * length * 0.7;
      const arrowY = start.y + normDirY * length * 0.7;

      // Draw arrow
      const arrowSize = 5;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * (normDirX + normDirY * 0.5),
        arrowY - arrowSize * (normDirY - normDirX * 0.5)
      );
      ctx.lineTo(
        arrowX - arrowSize * (normDirX - normDirY * 0.5),
        arrowY - arrowSize * (normDirY + normDirX * 0.5)
      );
      ctx.closePath();
      ctx.fillStyle = '#64B5F6';
      ctx.fill();
    }
  };

  // Function to draw greedy path lines - curved/stepped line through hops
  const drawGreedyPathLines = (ctx, points) => {
    // Find all greedy path points
    const greedyPathPoints = points.filter(point => point.isGreedyPath);

    // If there are not enough points for a path, return
    if (greedyPathPoints.length < 2) return;

    // Sort by pathIndex (hop order)
    greedyPathPoints.sort((a, b) => a.pathIndex - b.pathIndex);

    // Start drawing the path
    ctx.beginPath();
    ctx.moveTo(greedyPathPoints[0].x, greedyPathPoints[0].y);

    // Create gradient path
    const startPoint = greedyPathPoints[0];
    const endPoint = greedyPathPoints[greedyPathPoints.length - 1];

    const gradient = ctx.createLinearGradient(
      startPoint.x, startPoint.y,
      endPoint.x, endPoint.y
    );
    gradient.addColorStop(0, '#4CAF50');    // Start with deep green
    gradient.addColorStop(1, '#81C784');    // End with light green

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;

    // Draw curved lines through all points using quadratic curves for smoother appearance
    if (greedyPathPoints.length === 2) {
      // Just two points - draw straight line
      ctx.lineTo(greedyPathPoints[1].x, greedyPathPoints[1].y);
    } else {
      // Multiple points - use curves
      for (let i = 1; i < greedyPathPoints.length - 1; i++) {
        const current = greedyPathPoints[i];
        const next = greedyPathPoints[i + 1];

        // Calculate control point for quadratic curve
        const cpX = current.x;
        const cpY = current.y;

        // Calculate midpoint for smoother curves
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;

        ctx.quadraticCurveTo(cpX, cpY, midX, midY);
      }

      // Draw final segment to the last point
      const lastPoint = greedyPathPoints[greedyPathPoints.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    // Render the complete path
    ctx.stroke();

    // Add direction arrows along the path segments
    for (let i = 1; i < greedyPathPoints.length; i++) {
      const start = greedyPathPoints[i - 1];
      const end = greedyPathPoints[i];

      // Calculate direction vector
      const dirX = end.x - start.x;
      const dirY = end.y - start.y;
      const length = Math.sqrt(dirX * dirX + dirY * dirY);

      if (length < 20) continue; // Skip arrows for short segments

      // Normalize direction vector
      const normDirX = dirX / length;
      const normDirY = dirY / length;

      // Calculate position 70% along the line
      const arrowX = start.x + normDirX * length * 0.7;
      const arrowY = start.y + normDirY * length * 0.7;

      // Draw arrow
      const arrowSize = 5;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * (normDirX + normDirY * 0.5),
        arrowY - arrowSize * (normDirY - normDirX * 0.5)
      );
      ctx.lineTo(
        arrowX - arrowSize * (normDirX - normDirY * 0.5),
        arrowY - arrowSize * (normDirY + normDirX * 0.5)
      );
      ctx.closePath();
      ctx.fillStyle = '#81C784';
      ctx.fill();
    }
  };

  // Function to draw axis projection visualization — dashed axis line + perpendicular drop lines
  const drawAxisProjectionLines = (ctx, points) => {
    const projPoints = points.filter(point => point.isAxisProjection);
    if (projPoints.length < 2) return;

    const endpoints = projPoints.filter(p => p.isEndpoint);
    const projected = projPoints.filter(p => !p.isEndpoint);

    if (endpoints.length < 2) return;

    const axisStart = endpoints[0];
    const axisEnd = endpoints[1];

    // Draw dashed axis line
    ctx.beginPath();
    ctx.setLineDash([8, 4]);
    ctx.moveTo(axisStart.x, axisStart.y);
    ctx.lineTo(axisEnd.x, axisEnd.y);
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Direction arrow on axis
    const dirX = axisEnd.x - axisStart.x;
    const dirY = axisEnd.y - axisStart.y;
    const axisLen = Math.sqrt(dirX * dirX + dirY * dirY);

    if (axisLen > 30) {
      const normX = dirX / axisLen;
      const normY = dirY / axisLen;
      const arrowX = axisStart.x + normX * axisLen * 0.85;
      const arrowY = axisStart.y + normY * axisLen * 0.85;
      const arrowSize = 6;

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * (normX + normY * 0.5),
        arrowY - arrowSize * (normY - normX * 0.5)
      );
      ctx.lineTo(
        arrowX - arrowSize * (normX - normY * 0.5),
        arrowY - arrowSize * (normY + normX * 0.5)
      );
      ctx.closePath();
      ctx.fillStyle = '#FF9800';
      ctx.fill();
    }

    // Draw perpendicular drop lines from each projected word to the axis
    if (axisLen === 0) return;
    const ux = dirX / axisLen;
    const uy = dirY / axisLen;

    projected.forEach(p => {
      // Project point onto screen-space axis line
      const dx = p.x - axisStart.x;
      const dy = p.y - axisStart.y;
      const t = (dx * ux + dy * uy);
      const projX = axisStart.x + t * ux;
      const projY = axisStart.y + t * uy;

      // Draw thin perpendicular line
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(projX, projY);
      ctx.strokeStyle = 'rgba(255, 183, 77, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw small dot at projection point on axis
      ctx.beginPath();
      ctx.arc(projX, projY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
      ctx.fill();
    });
  };

  const drawAnalogySelectionLines = (ctx, points, selectedWords) => {
    if (selectedWords.length < 2) return;

    // Get the points for the selected words
    const selectedPoints = [];
    
    for (const word of selectedWords) {
      const point = points.find(p => p.word === word);
      if (point) {
        selectedPoints.push(point);
      }
    }
    
    // Draw lines between consecutive selected points
    for (let i = 0; i < selectedPoints.length - 1; i++) {
      const point1 = selectedPoints[i];
      const point2 = selectedPoints[i + 1];
      
      ctx.beginPath();
      ctx.moveTo(point1.x, point1.y);
      ctx.lineTo(point2.x, point2.y);
      
      if (analogyMode) {
        ctx.strokeStyle = 'rgba(255, 128, 8, 0.7)'; // Orange for analogy
      } else {
        ctx.strokeStyle = 'rgba(66, 133, 244, 0.7)'; // Blue for regular selection
      }
      
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]); // Dashed line
      ctx.stroke();
      ctx.setLineDash([]); // Reset to solid line
    }
  };
  
  // Handle mouse move for point and similarity label hovering
  const handleMouseMove = (e) => {
    if (!canvasRef.current || !pointsRef.current.length) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if mouse is over any similarity label first (prioritize these)
    const similarityLabels = similarityLabelsRef.current;
    let hoveredLabel = null;
    
    for (const label of similarityLabels) {
      if (
        mouseX >= label.x && 
        mouseX <= label.x + label.width && 
        mouseY >= label.y && 
        mouseY <= label.y + label.height
      ) {
        hoveredLabel = label;
        break;
      }
    }
    
    if (hoveredLabel) {
      canvasRef.current.style.cursor = 'help';
      createSimilarityTooltip(e, hoveredLabel.similarity);
      return;
    }
    
    // If not over a similarity label, check for points
    let hoveredPoint = null;
    
    for (const point of pointsRef.current) {
      const distance = Math.sqrt(
        Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
      );
      
      if (distance <= point.radius) {
        hoveredPoint = point;
        break;
      }
    }
    
    if (hoveredPoint) {
      canvasRef.current.style.cursor = 'pointer';
      createTooltip(hoveredPoint, e);
    } else {
      canvasRef.current.style.cursor = 'default';
      removeTooltip();
    }
  };
  
  const handleMouseLeave = () => {
    removeTooltip();
  };
  
  // Update handle click to support both midpoint and analogy modes, plus pinning
  const handleClick = (e) => {
    if (!canvasRef.current || !pointsRef.current.length) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if mouse is over any point
    let clickedPoint = null;
    for (const point of pointsRef.current) {
      const distance = Math.sqrt(
        Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
      );

      if (distance <= point.radius) {
        clickedPoint = point;
        break;
      }
    }

    // If in selection or analogy mode, use the selection callback
    if ((selectionMode || analogyMode) && onPointSelected) {
      if (clickedPoint) {
        onPointSelected(clickedPoint.word);
      }
      return;
    }

    // Otherwise, handle pinning
    if (clickedPoint) {
      // Toggle pin - if clicking the same point, unpin it
      if (pinnedPoint && pinnedPoint.word === clickedPoint.word) {
        setPinnedPoint(null);
      } else {
        setPinnedPoint(clickedPoint);
      }
    } else {
      // Clicked on empty space, unpin
      setPinnedPoint(null);
    }
  };

  // Handle touch start for mobile
  const handleTouchStart = (e) => {
    if (!canvasRef.current) return;

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    touchStartRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      time: Date.now()
    };
  };

  // Handle touch end for mobile tap detection
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current || !canvasRef.current || !pointsRef.current.length) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const touchEnd = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      time: Date.now()
    };

    // Calculate if this was a tap (short duration and small movement)
    const dx = touchEnd.x - touchStartRef.current.x;
    const dy = touchEnd.y - touchStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = touchEnd.time - touchStartRef.current.time;

    // If movement is less than 10px and duration less than 300ms, it's a tap
    if (distance < 10 && duration < 300) {
      // Prevent default to avoid scroll/zoom in selection modes
      if (selectionMode || analogyMode) {
        e.preventDefault();
      }

      // Find the tapped point
      let tappedPoint = null;
      for (const point of pointsRef.current) {
        const pointDistance = Math.sqrt(
          Math.pow(touchEnd.x - point.x, 2) + Math.pow(touchEnd.y - point.y, 2)
        );

        // Increase hit area for touch (add 10px to radius)
        if (pointDistance <= point.radius + 10) {
          tappedPoint = point;
          break;
        }
      }

      // Check if in selection or analogy mode
      if ((selectionMode || analogyMode) && onPointSelected) {
        if (tappedPoint) {
          onPointSelected(tappedPoint.word);
        }
      } else {
        // Handle pinning on tap when not in selection mode
        if (tappedPoint) {
          // Toggle pin - if tapping the same point, unpin it
          if (pinnedPoint && pinnedPoint.word === tappedPoint.word) {
            setPinnedPoint(null);
          } else {
            setPinnedPoint(tappedPoint);
          }
        } else {
          // Tapped on empty space, unpin
          setPinnedPoint(null);
        }
      }
    }

    touchStartRef.current = null;
  };

  return (
    <>
      {isLoading ? (
        <SimpleLoadingAnimation
          width={containerRef.current?.clientWidth || 800}
          height={containerRef.current?.clientHeight || 600}
        />
      ) : (
        <canvas
          ref={canvasRef}
          className={styles.vectorCanvas}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      )}

      {/* Pinned point info card */}
      {pinnedPoint && (
        <div className={styles.pinnedPointCard}>
          <div className={styles.pinnedPointHeader}>
            <span className={styles.pinnedPointWord}>{pinnedPoint.word}</span>
            <button
              className={styles.pinnedPointClose}
              onClick={() => setPinnedPoint(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className={styles.pinnedPointInfo}>
            {pinnedPoint.isPrimary && <span className={`${styles.pinnedPointBadge} ${styles.primary}`}>Primary</span>}
            {pinnedPoint.isAnalogy && <span className={`${styles.pinnedPointBadge} ${styles.analogy}`}>Analogy Result</span>}
            {pinnedPoint.isContextSample && <span className={`${styles.pinnedPointBadge} ${styles.context}`}>Context</span>}
            {pinnedPoint.isMidpoint && <span className={`${styles.pinnedPointBadge} ${styles.midpoint}`}>Midpoint</span>}
            {pinnedPoint.isSlice && <span className={`${styles.pinnedPointBadge} ${styles.slice}`}>Slice</span>}
          </div>
          {pinnedPoint.truncatedVector && (
            <div className={styles.pinnedPointVector}>
              <span className={styles.vectorLabel}>Vector:</span>
              <span className={styles.vectorValue}>{pinnedPoint.truncatedVector}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default VectorGraph2D;
