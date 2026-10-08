import React from 'react';

/**
 * Renders a fan-like projection to visualize an ongoing analogy search
 * 
 * @param {Object} sourcePoint - The point from which the projection starts (the third selected point)
 * @param {Object} referencePoint1 - The first point in the analogy reference (first selected point)
 * @param {Object} referencePoint2 - The second point in the analogy reference (second selected point)
 * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
 * @param {number} [timestamp=Date.now()] - Current timestamp for animation effects
 */
const drawAnalogyProjection = (sourcePoint, referencePoint1, referencePoint2, ctx, timestamp = Date.now()) => {
  if (!sourcePoint || !referencePoint1 || !referencePoint2 || !ctx) {
    return;
  }
  
  try {
    // Calculate the vector from reference1 to reference2
    const vectorX = referencePoint2.x - referencePoint1.x;
    const vectorY = referencePoint2.y - referencePoint1.y;
    
    // Calculate the angle of the reference vector
    const angle = Math.atan2(vectorY, vectorX);
    
    // Calculate the magnitude of the reference vector (used for scale)
    const magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    
    // Draw fan-like projection rays
    const numRays = 12; // Number of rays in the fan
    const spreadAngle = Math.PI / 4; // 45 degrees spread
    const maxLength = magnitude * 1.5; // Make the projection a bit longer than the reference vector
    
    // Create gradient for rays
    const gradient = ctx.createLinearGradient(
      sourcePoint.x, 
      sourcePoint.y,
      sourcePoint.x + Math.cos(angle) * maxLength,
      sourcePoint.y + Math.sin(angle) * maxLength
    );
    
    gradient.addColorStop(0, 'rgba(156, 39, 176, 0.8)');
    gradient.addColorStop(1, 'rgba(156, 39, 176, 0)');
    
    // Draw the rays with animation
    const animationOffset = (timestamp % 2000) / 2000;
    
    for (let i = 0; i < numRays; i++) {
      // Calculate the angle for this ray
      const rayAngle = angle - (spreadAngle / 2) + (spreadAngle * ((i + animationOffset) % numRays) / (numRays - 1));
      
      // Calculate ray endpoint
      const endX = sourcePoint.x + Math.cos(rayAngle) * maxLength;
      const endY = sourcePoint.y + Math.sin(rayAngle) * maxLength;
      
      // Draw ray
      ctx.beginPath();
      ctx.moveTo(sourcePoint.x, sourcePoint.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.8 - (Math.abs(i - (numRays - 1) / 2) / numRays);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
    
    // Add a more prominent pulsing animation at the base
    const pulseRadius = 5 + Math.sin(timestamp / 200) * 3;
    
    ctx.beginPath();
    ctx.arc(sourcePoint.x, sourcePoint.y, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(156, 39, 176, 0.5)';
    ctx.fill();
    
    // Draw a small arrow in the average direction to make it more clear
    const avgAngle = angle;
    const arrowLength = 15;
    const arrowX = sourcePoint.x + Math.cos(avgAngle) * arrowLength;
    const arrowY = sourcePoint.y + Math.sin(avgAngle) * arrowLength;
    
    ctx.beginPath();
    ctx.moveTo(sourcePoint.x, sourcePoint.y);
    ctx.lineTo(arrowX, arrowY);
    ctx.strokeStyle = 'rgba(156, 39, 176, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw arrowhead
    const arrowHeadSize = 6;
    ctx.beginPath();
    ctx.moveTo(
      arrowX - Math.cos(avgAngle - Math.PI/6) * arrowHeadSize,
      arrowY - Math.sin(avgAngle - Math.PI/6) * arrowHeadSize
    );
    ctx.lineTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - Math.cos(avgAngle + Math.PI/6) * arrowHeadSize,
      arrowY - Math.sin(avgAngle + Math.PI/6) * arrowHeadSize
    );
    ctx.fillStyle = 'rgba(156, 39, 176, 0.9)';
    ctx.fill();
  } catch (error) {
    console.error('Error drawing analogy projection:', error);
    // Fallback to simpler visualization in case of error
    try {
      ctx.beginPath();
      ctx.arc(sourcePoint.x, sourcePoint.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(156, 39, 176, 0.5)';
      ctx.fill();
    } catch {
      // Silent fail if even the fallback fails
    }
  }
};

export default drawAnalogyProjection; 
