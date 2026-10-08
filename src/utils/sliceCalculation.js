import axios from 'axios';
import { getApiUrl } from './environment';

/**
 * Finds a slice (cross-section) through the vector space using recursive midpoint calculations
 * 
 * @param {string} word1 - First word (starting point)
 * @param {string} word2 - Second word (ending point)
 * @param {number} numResults - Number of results per midpoint
 * @param {number} maxDepth - Maximum recursion depth to prevent infinite loops
 * @returns {Promise<Object>} - Slice results
 */
export const findSlice = async (
  word1,
  word2,
  numResults = 5,
  maxDepth = 20
) => {
  const apiUrl = getApiUrl('/api/findSlice');

  try {
    
    // Validate input
    if (!word1 || !word2) {
      throw new Error('Both words are required for slice calculation');
    }
    
    
    // Log detailed request information for debugging
    
    const response = await axios.post(apiUrl, {
      word1,
      word2,
      numResults,
      maxDepth
    });
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Error finding slice:', error);
    
    if (error.response) {
      console.error('Server response:', error.response.data);
      console.error('Status code:', error.response.status);
      
      // Better error message for 404 errors
      if (error.response.status === 404) {
        if (error.response.data && error.response.data.error) {
          throw new Error(`Server error (404): ${error.response.data.error}`);
        } else {
          throw new Error('API endpoint not found (404). The server may not be running or the endpoint may not be registered.');
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      throw new Error('No response received from server. The server may be down or unreachable.');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    // Add detailed debug info to the error
    const enhancedError = new Error(`Failed to find slice: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.requestDetails = {
      url: apiUrl,
      data: { word1, word2, numResults, maxDepth }
    };
    throw enhancedError;
  }
};

/**
 * Process slice API response into visualization-ready format
 * 
 * @param {Object} results - Slice results from API
 * @param {string} word1 - First source word
 * @param {string} word2 - Second source word
 * @returns {Object} - Formatted slice cluster for visualization
 */
export const processSliceResults = (results, word1, word2) => {
  // Process results for visualization
  const sliceCluster = {
    type: 'slice',
    source: {
      word1,
      word2
    },
    words: []
  };
  
  // Add endpoint words
  sliceCluster.words.push({
    word: word1,
    isSlice: true,
    isEndpoint: true,
    isMainPoint: true,
    sliceLevel: 'endpoint',
    sliceIndex: 0,
    sliceDepth: 0
  });
  
  sliceCluster.words.push({
    word: word2,
    isSlice: true,
    isEndpoint: true,
    isMainPoint: true,
    sliceLevel: 'endpoint',
    sliceIndex: 1,
    sliceDepth: 0
  });
  
  // Add slice points
  if (results.slicePoints && results.slicePoints.length > 0) {
    // First add main slice points that form the path
    const mainPoints = results.slicePoints.filter(point => 
      point.isMainPoint === true && !point.isEndpoint
    );
    
    mainPoints.forEach(point => {
      sliceCluster.words.push({
        word: point.word,
        distance: point.distance || 0,
        similarity: point.similarity,
        isSlice: true,
        isMainPoint: true,
        sliceLevel: 'main',
        sliceIndex: point.index || 0,
        sliceDepth: point.depth || 0,
        sliceSource: {
          fromWords: point.fromWords || [],
          path: point.path || []
        }
      });
    });

    // Group neighbor points by their source
    const neighborsBySource = new Map();
    const neighborPoints = results.slicePoints.filter(point => 
      point.isMainPoint !== true && !point.isEndpoint
    );
    
    // Create a map of source word -> [neighbor points]
    neighborPoints.forEach(point => {
      if (point.fromWords && point.fromWords.length > 0) {
        const sourceWord = point.fromWords[0];
        if (!neighborsBySource.has(sourceWord)) {
          neighborsBySource.set(sourceWord, []);
        }
        neighborsBySource.get(sourceWord).push(point);
      }
    });
    
    // For each source, find the closest neighbor
    neighborsBySource.forEach((neighbors) => {
      // Sort by distance (ascending)
      neighbors.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      // Add only the closest neighbor
      if (neighbors.length > 0) {
        const closestNeighbor = neighbors[0];
        sliceCluster.words.push({
          word: closestNeighbor.word,
          distance: closestNeighbor.distance || 0,
          isSlice: true,
          isMainPoint: false,
          sliceLevel: 'neighbor',
          sliceIndex: closestNeighbor.index || 0,
          sliceDepth: closestNeighbor.depth || 0,
          sliceSource: {
            fromWords: closestNeighbor.fromWords || [],
            path: closestNeighbor.path || []
          }
        });
      }
    });
  }
  
  return sliceCluster;
}; 
