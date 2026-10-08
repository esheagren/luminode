import axios from 'axios';
import { getApiUrl } from './environment';

/**
 * Finds nearest neighbors for a word
 * 
 * @param {string} word - The word to find neighbors for
 * @param {number} numResults - Number of neighbors to return
 * @returns {Promise<Object>} - The API response containing neighbors
 */
export const findNeighbors = async (word, numResults = 4) => {
  try {
    
    // Validate input
    if (!word) {
      throw new Error('Word is required for finding neighbors');
    }
    
    const apiUrl = getApiUrl('/api/findNeighbors');
    
    // Log request information
    
    const response = await axios.post(apiUrl, {
      word,
      numResults
    });
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Error finding neighbors:', error);
    
    if (error.response) {
      console.error('Server response:', error.response.data);
      console.error('Status code:', error.response.status);
      
      if (error.response.status === 404) {
        if (error.response.data && error.response.data.error) {
          throw new Error(`Server error (404): ${error.response.data.error}`);
        } else {
          throw new Error('API endpoint not found (404)');
        }
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response received from server');
    }
    
    throw new Error(`Failed to find neighbors: ${error.message}`);
  }
};

/**
 * Processes neighbors API response into visualization-ready format
 * 
 * @param {Object} results - Neighbors results from API
 * @param {string} sourceWord - Source word
 * @returns {Object} - Formatted neighbors cluster for visualization
 */
export const processNeighborsResults = (results, sourceWord) => {
  // Process results for visualization
  const neighborsCluster = {
    type: 'neighbors',
    source: {
      word: sourceWord
    },
    words: []
  };
  
  // Add source word
  neighborsCluster.words.push({
    word: sourceWord,
    isNeighbor: false,
    isSource: true,
    neighborScore: 1.0
  });
  
  // Add neighbor points
  if (results.nearestWords && results.nearestWords.length > 0) {
    results.nearestWords.forEach((neighbor, index) => {
      neighborsCluster.words.push({
        word: neighbor.word,
        isNeighbor: true,
        isSource: false,
        neighborScore: neighbor.score,
        neighborRank: index + 1,
        neighborSource: sourceWord
      });
    });
  }
  
  return neighborsCluster;
}; 