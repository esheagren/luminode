import React, { useEffect, useRef } from 'react';
import styles from './SimpleLoadingAnimation.module.css';

const SimpleLoadingAnimation = ({ width = 200, height = 200 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Make sure we have valid dimensions
    const canvasWidth = width || 200;
    const canvasHeight = height || 200;
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    let time = 0;
    
    const draw = () => {
      // Clear canvas with a transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Center of canvas
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Increment time
      time += 0.01;
      
      // Draw a pulsing circle
      const radius = 20 + Math.sin(time) * 5;
      const opacity = 0.3 + Math.sin(time * 0.5) * 0.2;
      
      // Draw outer circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 165, 0, ${opacity * 0.3})`;
      ctx.fill();
      
      // Draw inner circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 165, 0, ${opacity})`;
      ctx.fill();
      
      // Draw loading dots
      const dotCount = 8;
      const dotRadius = 3;
      const dotDistance = radius * 1.5;
      
      for (let i = 0; i < dotCount; i++) {
        const angle = (i / dotCount) * Math.PI * 2 + time;
        const x = centerX + Math.cos(angle) * dotDistance;
        const y = centerY + Math.sin(angle) * dotDistance;
        
        const dotOpacity = 0.2 + 0.8 * Math.abs(Math.sin(angle + time * 2));
        
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 165, 0, ${dotOpacity})`;
        ctx.fill();
      }
      
      // Continue animation
      animationRef.current = requestAnimationFrame(draw);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(draw);
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height]);
  
  return (
    <div className={styles.simpleLoadingAnimationContainer}>
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
};

export default SimpleLoadingAnimation; 
