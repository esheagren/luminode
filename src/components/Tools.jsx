import React, { useState } from 'react';
import MidpointSelection from './MidpointSelection';
import AnalogySelection from './AnalogySelection';
import SliceSelection from './SliceSelection';
import LinearPathSelection from './LinearPathSelection';
import GreedyPathSelection from './GreedyPathSelection';
import ProjectionSelection from './ProjectionSelection';
import ViewButton from './ViewButton';
import { findMidpoint, processMidpointResults } from '../utils/vectorCalculation';
import { findAnalogy } from '../utils/findAnalogy';
import { findSlice, processSliceResults } from '../utils/sliceCalculation';
import { findLinearPath, processLinearPathResults } from '../utils/linearPathCalculation';
import { findGreedyPath, processGreedyPathResults } from '../utils/greedyPathCalculation';
import { findAxisProjection, processAxisProjectionResults } from '../utils/axisProjectionCalculation';
import { findNeighbors, processNeighborsResults } from '../utils/findNeighbors';
import { createToolbarTooltip, removeToolbarTooltip } from './ToolbarTooltip';
import './ToolbarStyles.css';
import styles from './Tools.module.css';

// Import icons from a reliable source like Feather or include SVG directly
// Book icon for Learn button
const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const MidpointIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);

const AnalogyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="8" r="2"></circle>
    <circle cx="7" cy="16" r="2"></circle>
    <circle cx="17" cy="8" r="2"></circle>
    <circle cx="17" cy="16" r="2"></circle>
  </svg>
);

const SliceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5"></line>
  </svg>
);

const LinearPathIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="4" cy="12" r="2"></circle>
    <circle cx="20" cy="12" r="2"></circle>
    <line x1="6" y1="12" x2="18" y2="12"></line>
    <circle cx="9" cy="12" r="1" fill="currentColor"></circle>
    <circle cx="12" cy="12" r="1" fill="currentColor"></circle>
    <circle cx="15" cy="12" r="1" fill="currentColor"></circle>
  </svg>
);

const ProjectionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="20" x2="21" y2="4"></line>
    <circle cx="3" cy="20" r="1.5" fill="currentColor"></circle>
    <circle cx="21" cy="4" r="1.5" fill="currentColor"></circle>
    <line x1="8" y1="6" x2="9.5" y2="13.5" strokeDasharray="2 2"></line>
    <circle cx="8" cy="6" r="1.5" fill="currentColor" opacity="0.6"></circle>
    <line x1="16" y1="18" x2="14.5" y2="11" strokeDasharray="2 2"></line>
    <circle cx="16" cy="18" r="1.5" fill="currentColor" opacity="0.6"></circle>
  </svg>
);

const GreedyPathIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="4" cy="18" r="2"></circle>
    <circle cx="20" cy="6" r="2"></circle>
    <path d="M6 17 L10 14 L14 15 L18 7"></path>
    <polyline points="15,6 19,6 19,10"></polyline>
  </svg>
);

const RulerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 8c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8z"></path>
    <path d="M18 16V8"></path>
    <path d="M14 16V8"></path>
    <path d="M10 16V8"></path>
    <path d="M6 16V8"></path>
  </svg>
);

const NeighborsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8"></circle>
    <circle cx="12" cy="12" r="3"></circle>
    <line x1="12" y1="2" x2="12" y2="4"></line>
    <line x1="12" y1="20" x2="12" y2="22"></line>
    <line x1="20" y1="12" x2="22" y2="12"></line>
    <line x1="2" y1="12" x2="4" y2="12"></line>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={styles.spinnerIcon}>
    <path d="M12 2a10 10 0 0 1 10 10"></path>
  </svg>
);

const Tools = ({
  words,
  numMidpoints,
  setMidpointClusters,
  setLoading,
  setError,
  loading,
  viewMode,
  setViewMode,
  rulerActive,
  setRulerActive,
  selectionMode,
  setSelectionMode,
  selectedPoints,
  setSelectedPoints,
  analogyMode,
  setAnalogyMode,
  analogyStep,
  setAnalogyStep,
  isSearchingAnalogy,
  setIsSearchingAnalogy,
  sliceMode,
  setSliceMode,
  linearPathMode,
  setLinearPathMode,
  greedyPathMode,
  setGreedyPathMode,
  projectionMode,
  setProjectionMode,
  learnMode,
  setLearnMode,
  setActiveTool,
  hideViewButton = false
}) => {
  const [activeTab, setActiveTab] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [neighborsActive, setNeighborsActive] = useState(false);
  const [neighborsLoading, setNeighborsLoading] = useState(false);
  
  

  const handleTabClick = (tab) => {

    if (tab === activeTab) {
      // If clicking on tab when already active, toggle appropriate mode
      if (tab === 'analogy') {
        toggleAnalogyMode();
      } else if (tab === 'slice') {
        toggleSliceMode();
      } else if (tab === 'linearPath') {
        toggleLinearPathMode();
      } else if (tab === 'greedyPath') {
        toggleGreedyPathMode();
      } else if (tab === 'projection') {
        toggleProjectionMode();
      } else {
        setShowContent(!showContent);
      }
    } else {
      // Switching to a different tab
      setActiveTab(tab);
      setShowContent(true);

      // Cancel selection mode when switching tabs
      if (selectionMode) {
        setSelectionMode(false);
        setSelectedPoints([]);
      }

      // Cancel analogy mode when switching away from analogy tab
      if (analogyMode && tab !== 'analogy') {
        setAnalogyMode(false);
        setAnalogyStep(0);
        setSelectedPoints([]);
      }

      // Cancel slice mode when switching away from slice tab
      if (sliceMode && tab !== 'slice') {
        setSliceMode(false);
        setSelectedPoints([]);
      }

      // Cancel linear path mode when switching away from linearPath tab
      if (linearPathMode && tab !== 'linearPath') {
        setLinearPathMode(false);
        setSelectedPoints([]);
      }

      // Cancel greedy path mode when switching away from greedyPath tab
      if (greedyPathMode && tab !== 'greedyPath') {
        setGreedyPathMode(false);
        setSelectedPoints([]);
      }

      // Cancel projection mode when switching away from projection tab
      if (projectionMode && tab !== 'projection') {
        setProjectionMode(false);
        setSelectedPoints([]);
      }

      // Activate the appropriate mode for the tab
      if (tab === 'analogy' && !analogyMode) {
        toggleAnalogyMode();
      } else if (tab === 'slice' && !sliceMode) {
        toggleSliceMode();
      } else if (tab === 'linearPath' && !linearPathMode) {
        toggleLinearPathMode();
      } else if (tab === 'greedyPath' && !greedyPathMode) {
        toggleGreedyPathMode();
      } else if (tab === 'projection' && !projectionMode) {
        toggleProjectionMode();
      }
    }
  };
  
  // Toggle analogy mode
  const toggleAnalogyMode = () => {
    if (analogyMode) {
      setAnalogyMode(false);
      setAnalogyStep(0);
      setSelectedPoints([]);
      setIsSearchingAnalogy(false);
    } else {
      // Ensure other modes are off
      setSelectionMode(false);
      setSliceMode(false);
      setLinearPathMode(false);
      setGreedyPathMode(false);
      // Turn on analogy mode
      setAnalogyMode(true);
      setAnalogyStep(0);
      setSelectedPoints([]);

      // Log the state immediately after setting
      setTimeout(() => {
      }, 0);
    }
  };

  // Toggle slice mode
  const toggleSliceMode = () => {
    if (sliceMode) {
      setSliceMode(false);
      setSelectedPoints([]);
    } else {
      // Ensure other modes are off
      setSelectionMode(false);
      setAnalogyMode(false);
      setLinearPathMode(false);
      setGreedyPathMode(false);
      // Turn on slice mode
      setSliceMode(true);
      setSelectedPoints([]);
    }
  };

  // Toggle linear path mode
  const toggleLinearPathMode = () => {
    if (linearPathMode) {
      setLinearPathMode(false);
      setSelectedPoints([]);
    } else {
      // Ensure other modes are off
      setSelectionMode(false);
      setAnalogyMode(false);
      setSliceMode(false);
      setGreedyPathMode(false);
      // Turn on linear path mode
      setLinearPathMode(true);
      setSelectedPoints([]);
    }
  };

  // Toggle greedy path mode
  const toggleGreedyPathMode = () => {
    if (greedyPathMode) {
      setGreedyPathMode(false);
      setSelectedPoints([]);
    } else {
      // Ensure other modes are off
      setSelectionMode(false);
      setAnalogyMode(false);
      setSliceMode(false);
      setLinearPathMode(false);
      // Turn on greedy path mode
      setGreedyPathMode(true);
      setSelectedPoints([]);
    }
  };
  
  // Find midpoint for the selected points
  const findMidpointForSelectedPoints = async () => {
    if (selectedPoints.length !== 2) {
      setError('Please select two points first');
      return;
    }
    
    const [word1, word2] = selectedPoints;
    
    setLoading(true);
    
    try {
      // Call the midpoint API
      const results = await findMidpoint(word1, word2, numMidpoints, 0, true);
      
      // Process the results into visualization format
      const midpointCluster = processMidpointResults(results, word1, word2, 0);
      
      // Update visualization
      setMidpointClusters([midpointCluster]);
      
      // Exit selection mode
      setSelectionMode(false);
      
    } catch (error) {
      console.error('Error finding midpoint:', error);
      setError(`Failed to find midpoint: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Find slice for the selected points
  const findSliceForSelectedPoints = async () => {
    if (selectedPoints.length !== 2) {
      setError('Please select start and end points first');
      return;
    }
    
    const [word1, word2] = selectedPoints;
    
    setLoading(true);
    
    try {
      
      // Call the slice API
      const results = await findSlice(word1, word2, numMidpoints, 20);
      
      // Process the results into visualization format
      const sliceCluster = processSliceResults(results, word1, word2);
      
      // Update visualization
      setMidpointClusters([sliceCluster]);
      
      // Exit slice mode
      setSliceMode(false);
      
    } catch (error) {
      console.error('Error finding slice:', error);
      
      // Create a more user-friendly error message
      let errorMessage = 'Failed to find slice';
      
      if (error.message.includes('404')) {
        errorMessage = 'The slice API endpoint returned a 404 error. The server may need to be restarted.';
      } else if (error.message.includes('timeout') || error.message.includes('Network Error')) {
        errorMessage = 'Connection timed out. Please check your network and server status.';
      } else {
        errorMessage = `Failed to find slice: ${error.message}`;
      }
      
      setError(errorMessage);
      
      // Log additional debugging info
    } finally {
      setLoading(false);
    }
  };
  
  // Effect to handle step transitions in analogy mode
  React.useEffect(() => {
    
    if (analogyMode) {
      // Update step based on number of selected points
      if (selectedPoints.length === 1 && analogyStep === 0) {
        setAnalogyStep(1);
      } else if (selectedPoints.length === 2 && analogyStep === 1) {
        setAnalogyStep(2);
      } else if (selectedPoints.length === 3 && analogyStep === 2) {
        // We're ready to search
        setAnalogyStep(3);
        // Automatically start the search without using useEffect to avoid dependency issues
        setTimeout(() => {
          findAnalogyForSelectedPoints();
        }, 0);
      }
    }
  }, [analogyMode, selectedPoints, analogyStep]);
  
  // Find analogy for the selected points
  const findAnalogyForSelectedPoints = async () => {
    if (selectedPoints.length !== 3) {
      setError('Please select three points for analogy');
      return;
    }
    
    const [word1, word2, word3] = selectedPoints;
    
    setIsSearchingAnalogy(true);
    setLoading(true);
    
    try {
      // Call the analogy API with timeout handling
      const timeout = setTimeout(() => {
        if (loading) {
          // Don't interrupt the actual search, just inform the user
          setError('The search is taking longer than expected. This might be due to backend service load.');
        }
      }, 8000); // Show warning after 8 seconds
      
      // Call the analogy API
      const response = await findAnalogy(word1, word2, word3, 5);
      
      clearTimeout(timeout);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (!response.data || !response.data.results || response.data.results.length === 0) {
        throw new Error('No analogy results found. The server may be experiencing issues.');
      }
      
      
      // Process the results
      const analogyResults = response.data.results.map(result => ({
        word: result.word,
        score: result.score,
        isAnalogy: true,
        analogySource: {
          from: word3,
          relation: `${word1}:${word2}::${word3}:${result.word}`
        }
      }));
      
      // Create analogy cluster for visualization
      const analogyCluster = {
        type: 'analogy',
        source: {
          word1, word2, word3
        },
        words: [
          // Include the three input words
          { word: word1, isAnalogy: false },
          { word: word2, isAnalogy: false },
          { word: word3, isAnalogy: false },
          // Include analogy results
          ...analogyResults
        ]
      };
      
      // Update visualization
      setMidpointClusters([analogyCluster]);
      
      // Move to step 4 (completed)
      setAnalogyStep(4);
      
    } catch (error) {
      console.error('Error finding analogy:', error);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to find analogy';
      
      if (error.message?.includes('timeout') || error.message?.includes('504')) {
        errorMessage = 'The server timed out. The vector database might be experiencing high load. Please try again later.';
      } else if (error.message?.includes('No analogy')) {
        errorMessage = 'No strong analogies found. Try different words with clearer relationships.';
      } else {
        errorMessage = `Failed to find analogy: ${error.message || 'Unknown error'}`;
      }
      
      setError(errorMessage);
      
      // Reset to selection state
      setAnalogyStep(2);
    } finally {
      setLoading(false);
      setIsSearchingAnalogy(false);
    }
  };
  
  // Handle point selection for midpoint - no longer auto-triggering calculation
  React.useEffect(() => {
    
    // We no longer automatically trigger the midpoint calculation
    // This is now handled by the explicit Calculate button
    // Instead, we just log the state for debugging
  }, [selectedPoints, selectionMode, sliceMode]);
  
  // Reset analogy selection
  const resetAnalogySelection = () => {
    setSelectedPoints([]);
    setAnalogyStep(0);
    setIsSearchingAnalogy(false);
  };
  
  // Cancel analogy selection
  const cancelAnalogySelection = () => {
    setAnalogyMode(false);
    setSelectedPoints([]);
    setAnalogyStep(0);
    setIsSearchingAnalogy(false);
  };

  // Handle analogy search from inline input (new UX)
  const handleAnalogySearch = async (word1, word2, word3) => {

    setIsSearchingAnalogy(true);
    setLoading(true);
    setAnalogyStep(3);

    try {
      const response = await findAnalogy(word1, word2, word3, 5);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data || !response.data.results || response.data.results.length === 0) {
        throw new Error('No analogy results found.');
      }


      // Process the results
      const analogyResults = response.data.results.map(result => ({
        word: result.word,
        score: result.score,
        isAnalogy: true,
        analogySource: {
          from: word3,
          relation: `${word1}:${word2}::${word3}:${result.word}`
        }
      }));

      // Create analogy cluster for visualization
      const analogyCluster = {
        type: 'analogy',
        source: { word1, word2, word3 },
        words: [
          { word: word1, isAnalogy: false },
          { word: word2, isAnalogy: false },
          { word: word3, isAnalogy: false },
          ...analogyResults
        ]
      };

      // Update visualization
      setMidpointClusters([analogyCluster]);

      // Move to completed state
      setAnalogyStep(4);

    } catch (error) {
      console.error('Error finding analogy:', error);

      let errorMessage = 'Failed to find analogy';
      if (error.message?.includes('timeout') || error.message?.includes('504')) {
        errorMessage = 'The server timed out. Please try again later.';
      } else if (error.message?.includes('No analogy')) {
        errorMessage = 'No strong analogies found. Try different words.';
      } else {
        errorMessage = `Failed to find analogy: ${error.message || 'Unknown error'}`;
      }

      setError(errorMessage);
      setAnalogyStep(2);
    } finally {
      setLoading(false);
      setIsSearchingAnalogy(false);
    }
  };

  // Reset slice selection
  const resetSliceSelection = () => {
    setSelectedPoints([]);
  };
  
  // Cancel slice selection
  const cancelSliceSelection = () => {
    setSliceMode(false);
    setSelectedPoints([]);
  };

  // Find linear path for the selected points
  const findLinearPathForSelectedPoints = async () => {
    if (selectedPoints.length !== 2) {
      setError('Please select start and end points first');
      return;
    }

    const [word1, word2] = selectedPoints;

    setIsCalculating(true);
    setError(null);

    try {

      // Call the linear path API
      const results = await findLinearPath(word1, word2, 10);

      // Process the results into visualization format
      const linearPathCluster = processLinearPathResults(results, word1, word2);

      // Update visualization
      setMidpointClusters([linearPathCluster]);

      // Exit linear path mode
      setLinearPathMode(false);

    } catch (error) {
      console.error('Error finding linear path:', error);

      let errorMessage = 'Failed to find linear path';
      if (error.message.includes('405')) {
        errorMessage = 'Linear path not available. Please redeploy the server with the new endpoints.';
      } else if (error.message.includes('404')) {
        errorMessage = 'The linear path API endpoint returned a 404 error. The server may need to be restarted.';
      } else if (error.message.includes('timeout') || error.message.includes('Network Error')) {
        errorMessage = 'Connection timed out. Please check your network and server status.';
      } else {
        errorMessage = `Failed to find linear path: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  };

  // Reset linear path selection
  const resetLinearPathSelection = () => {
    setSelectedPoints([]);
  };

  // Cancel linear path selection
  const cancelLinearPathSelection = () => {
    setLinearPathMode(false);
    setSelectedPoints([]);
  };

  // Find greedy path for the selected points
  const findGreedyPathForSelectedPoints = async () => {
    if (selectedPoints.length !== 2) {
      setError('Please select start and target points first');
      return;
    }

    const [word1, word2] = selectedPoints;

    setIsCalculating(true);
    setError(null);

    try {

      // Call the greedy path API
      const results = await findGreedyPath(word1, word2, 20);

      // Process the results into visualization format
      const greedyPathCluster = processGreedyPathResults(results, word1, word2);

      // Update visualization
      setMidpointClusters([greedyPathCluster]);

      // Exit greedy path mode
      setGreedyPathMode(false);

    } catch (error) {
      console.error('Error finding greedy path:', error);

      let errorMessage = 'Failed to find greedy path';
      if (error.message.includes('405')) {
        errorMessage = 'Greedy path not available. Please redeploy the server with the new endpoints.';
      } else if (error.message.includes('404')) {
        errorMessage = 'The greedy path API endpoint returned a 404 error. The server may need to be restarted.';
      } else if (error.message.includes('timeout') || error.message.includes('Network Error')) {
        errorMessage = 'Connection timed out. Please check your network and server status.';
      } else {
        errorMessage = `Failed to find greedy path: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  };

  // Reset greedy path selection
  const resetGreedyPathSelection = () => {
    setSelectedPoints([]);
  };

  // Cancel greedy path selection
  const cancelGreedyPathSelection = () => {
    setGreedyPathMode(false);
    setSelectedPoints([]);
  };

  // Toggle projection mode
  const toggleProjectionMode = () => {
    if (projectionMode) {
      setProjectionMode(false);
      setSelectedPoints([]);
    } else {
      setSelectionMode(false);
      setAnalogyMode(false);
      setSliceMode(false);
      setLinearPathMode(false);
      setGreedyPathMode(false);
      setProjectionMode(true);
      setSelectedPoints([]);
    }
  };

  // Find axis projection for the selected points
  const findAxisProjectionForSelectedPoints = async () => {
    if (selectedPoints.length < 3) {
      setError('Select two axis words and at least one word to project');
      return;
    }

    const axisWord1 = selectedPoints[0];
    const axisWord2 = selectedPoints[1];
    const wordsToProject = selectedPoints.slice(2);

    setIsCalculating(true);
    setError(null);

    try {
      const results = await findAxisProjection(axisWord1, axisWord2, wordsToProject);

      const projectionCluster = processAxisProjectionResults(results, axisWord1, axisWord2);

      setMidpointClusters([projectionCluster]);
      setProjectionMode(false);
    } catch (error) {
      console.error('Error finding axis projection:', error);

      let errorMessage = 'Failed to calculate axis projection';
      if (error.message.includes('timeout') || error.message.includes('Network Error')) {
        errorMessage = 'Connection timed out. Please check your network and server status.';
      } else {
        errorMessage = `Failed to calculate projection: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  };

  const resetProjectionSelection = () => {
    setSelectedPoints([]);
  };

  const cancelProjectionSelection = () => {
    setProjectionMode(false);
    setSelectedPoints([]);
  };

  // Handle finding neighbors for all words in the visualization
  const handleNeighborsToggle = async () => {
    // Prevent toggling while already loading
    if (neighborsLoading) return;

    // Toggle the state
    const newState = !neighborsActive;
    setNeighborsActive(newState);

    if (!newState) {
      // If turning off, clear visualizations
      setMidpointClusters([]);
      return;
    }

    // Continue only if turning on
    if (words.length === 0) {
      setError('Please add some words first');
      setNeighborsActive(false); // Revert
      return;
    }

    setNeighborsLoading(true);
    setLoading(true);

    try {
      // Find nearest neighbors for each word
      const neighborsClusters = [];

      // Process words sequentially to avoid overwhelming the API
      for (const word of words) {
        try {
          const results = await findNeighbors(word, 4); // 4 neighbors per word

          if (results && results.nearestWords) {
            const cluster = processNeighborsResults(results, word);
            neighborsClusters.push(cluster);
          }
        } catch (wordError) {
          console.error(`Error finding neighbors for "${word}":`, wordError);
          // Continue with other words even if one fails
        }
      }

      // Update visualization with all clusters
      if (neighborsClusters.length > 0) {
        setMidpointClusters(neighborsClusters);
      } else {
        setError('No neighbors found for any words');
        setNeighborsActive(false); // Revert
      }
    } catch (error) {
      console.error('Error finding neighbors:', error);
      setError(`Failed to find neighbors: ${error.message}`);
      setNeighborsActive(false); // Revert on error
    } finally {
      setNeighborsLoading(false);
      setLoading(false);
    }
  };

  // Toggle learn mode
  const toggleLearnMode = () => {
    setLearnMode(!learnMode);
    
    // When enabling learn mode, set the active tool based on the current state
    if (!learnMode) {
      if (viewMode === '2D/3D') {
        setActiveTool('2D/3D');
      } else if (rulerActive) {
        setActiveTool('Measure');
      } else if (analogyMode) {
        setActiveTool('Analogy');
      } else if (sliceMode) {
        setActiveTool('Slice');
      } else if (projectionMode) {
        setActiveTool('Projection');
      } else {
        setActiveTool('Vector Embeddings');
      }
    }
  };

  // Track active tool when buttons are clicked
  const trackToolActivity = (toolName) => {
    if (learnMode) {
      setActiveTool(toolName);
    }
  };

  const renderToolContent = () => {
    if (!showContent) return null;
    
    if (selectionMode) {
      return (
        <MidpointSelection 
          selectedPoints={selectedPoints}
          onReset={() => setSelectedPoints([])}
          onCancel={() => {
            setSelectionMode(false);
            setSelectedPoints([]);
          }}
          onCalculate={findMidpointForSelectedPoints}
          loading={loading}
        />
      );
    }
    
    if (analogyMode) {
      return (
        <AnalogySelection
          selectedPoints={selectedPoints}
          analogyStep={analogyStep}
          onReset={resetAnalogySelection}
          onCancel={cancelAnalogySelection}
          onSearch={handleAnalogySearch}
          loading={loading || isSearchingAnalogy}
        />
      );
    }

    if (sliceMode) {
      return (
        <SliceSelection
          selectedPoints={selectedPoints}
          onReset={resetSliceSelection}
          onCancel={cancelSliceSelection}
          onCalculate={findSliceForSelectedPoints}
          loading={loading}
        />
      );
    }

    if (linearPathMode) {
      return (
        <LinearPathSelection
          selectedPoints={selectedPoints}
          onReset={resetLinearPathSelection}
          onCancel={cancelLinearPathSelection}
          onCalculate={findLinearPathForSelectedPoints}
          loading={isCalculating}
        />
      );
    }

    if (greedyPathMode) {
      return (
        <GreedyPathSelection
          selectedPoints={selectedPoints}
          onReset={resetGreedyPathSelection}
          onCancel={cancelGreedyPathSelection}
          onCalculate={findGreedyPathForSelectedPoints}
          loading={isCalculating}
        />
      );
    }

    if (projectionMode) {
      return (
        <ProjectionSelection
          selectedPoints={selectedPoints}
          onReset={resetProjectionSelection}
          onCancel={cancelProjectionSelection}
          onCalculate={findAxisProjectionForSelectedPoints}
          loading={isCalculating}
        />
      );
    }

    return null;
  };

  return (
    <div className={styles.toolsContainer}>
      <div className={styles.toolsHeader}>
        <div className={styles.toolButtons}>
          {!hideViewButton && (
            <ViewButton
              viewMode={viewMode}
              setViewMode={(mode) => {
                setViewMode(mode);
                trackToolActivity('3D');
              }}
              isCompact={true}
              onMouseEnter={(e) => createToolbarTooltip('3D', e)}
              onMouseLeave={() => removeToolbarTooltip()}
            />
          )}

          <button
            className={`${styles.iconButton} ${rulerActive ? styles.active : ''}`}
            onClick={() => {
              setRulerActive(!rulerActive);
              trackToolActivity('Measure');
            }}
            onMouseEnter={(e) => createToolbarTooltip('Measure', e)}
            onMouseLeave={() => removeToolbarTooltip()}
          >
            <RulerIcon />
            <span>Measure</span>
          </button>
          
          <button
            className={`${styles.iconButton} ${neighborsActive ? styles.active : ''} ${neighborsLoading ? styles.neighborsLoading : ''}`}
            onClick={() => {
              handleNeighborsToggle();
              trackToolActivity('Neighbors');
            }}
            disabled={loading || words.length === 0}
            onMouseEnter={(e) => createToolbarTooltip('Neighbors', e)}
            onMouseLeave={() => removeToolbarTooltip()}
          >
            {neighborsLoading ? <SpinnerIcon /> : <NeighborsIcon />}
            <span>{neighborsLoading ? 'Searching...' : 'Neighbors'}</span>
          </button>
          
          <button
            className={`${styles.iconButton} ${activeTab === 'analogy' ? styles.active : ''} ${analogyMode ? styles.analogyActive : ''}`}
            onClick={() => {
              handleTabClick('analogy');
              trackToolActivity('Analogy');
            }}
            disabled={loading || selectionMode || sliceMode}
            onMouseEnter={(e) => createToolbarTooltip('Analogy', e)}
            onMouseLeave={() => removeToolbarTooltip()}
          >
            <AnalogyIcon />
            <span>Analogy</span>
          </button>

          <button
            className={`${styles.iconButton} ${activeTab === 'slice' ? styles.active : ''} ${sliceMode ? styles.sliceActive : ''}`}
            onClick={() => {
              handleTabClick('slice');
              trackToolActivity('Slice');
            }}
            disabled={loading || selectionMode || analogyMode || linearPathMode || greedyPathMode}
            onMouseEnter={(e) => createToolbarTooltip('Slice', e)}
            onMouseLeave={() => removeToolbarTooltip()}
          >
            <SliceIcon />
            <span>{sliceMode ? `Slice (${selectedPoints.length}/2)` : "Slice"}</span>
          </button>

          <button
            className={`${styles.iconButton} ${activeTab === 'linearPath' ? styles.active : ''} ${linearPathMode ? styles.linearPathActive : ''}`}
            onClick={() => {
              handleTabClick('linearPath');
              trackToolActivity('Linear Path');
            }}
            disabled={loading || selectionMode || analogyMode || sliceMode || greedyPathMode}
            onMouseEnter={(e) => createToolbarTooltip('Linear Path', e)}
            onMouseLeave={() => removeToolbarTooltip()}
          >
            <LinearPathIcon />
            <span>{linearPathMode ? `Linear (${selectedPoints.length}/2)` : "Linear"}</span>
          </button>

          <button
            className={`${styles.iconButton} ${activeTab === 'greedyPath' ? styles.active : ''} ${greedyPathMode ? styles.greedyPathActive : ''}`}
            onClick={() => {
              handleTabClick('greedyPath');
              trackToolActivity('Greedy Path');
            }}
            disabled={loading || selectionMode || analogyMode || sliceMode || linearPathMode}
            onMouseEnter={(e) => createToolbarTooltip('Greedy Path', e)}
            onMouseLeave={() => removeToolbarTooltip()}
          >
            <GreedyPathIcon />
            <span>{greedyPathMode ? `Greedy (${selectedPoints.length}/2)` : "Greedy"}</span>
          </button>

          <button
            className={`${styles.iconButton} ${activeTab === 'projection' ? styles.active : ''} ${projectionMode ? 'projection-active' : ''}`}
            onClick={() => {
              handleTabClick('projection');
              trackToolActivity('Projection');
            }}
            disabled={loading || selectionMode || analogyMode || sliceMode || linearPathMode || greedyPathMode}
            onMouseEnter={(e) => createToolbarTooltip('Projection', e)}
            onMouseLeave={() => removeToolbarTooltip()}
          >
            <ProjectionIcon />
            <span>{projectionMode ? `Project (${selectedPoints.length})` : "Project"}</span>
          </button>

          <div className={styles.spacer}></div>
          
          <button 
            className={`${styles.iconButton} ${styles.learnButton} ${learnMode ? styles.active : ''}`}
            onClick={toggleLearnMode}
          >
            <BookIcon />
            <span>Learn</span>
          </button>
        </div>
      </div>
      
      <div className={`${styles.toolContent} ${showContent ? styles.visible : styles.hidden}`}>
        {renderToolContent()}
      </div>
      
    </div>
  );
};

export default Tools;