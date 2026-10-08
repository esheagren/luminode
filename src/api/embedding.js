import axios from 'axios';
import { getBaseUrl } from '../utils/environment';

// Log environment information for debugging

// Create axios instance with dynamic configuration
const getApiClient = () => {
  // Get the base URL for API requests based on environment
  const baseURL = getBaseUrl();
  
  // Create and configure the axios instance
  const client = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds timeout
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return client;
};

// Use a function to get the API client to ensure we have the latest environment settings
const apiRequest = async (endpoint, method = 'post', data = null) => {
  const client = getApiClient();
  
  try {
    // Make sure endpoint always starts with /api/
    const apiEndpoint = endpoint.startsWith('/api/') 
      ? endpoint 
      : `/api/${endpoint.replace(/^\//, '')}`;
      
    const response = await client[method](apiEndpoint, data);
    return response.data;
  } catch (error) {
    console.error(`API Request to ${endpoint} failed:`, error.message);
    throw error;
  }
};

/**
 * Check if a word exists and get its vector
 * @param {string} word - Word to check
 * @returns {Promise<Object>} - Word info including vector
 */
export const checkWord = async (word) => {
  try {
    const response = await apiRequest('checkWord', 'post', { word });
    return response;
  } catch (error) {
    console.error(`Error checking word "${word}":`, error.message);
    // Return a standardized error response
    return {
      success: false,
      error: `Failed to check word: ${error.message}`,
      word: {
        exists: false,
        vector: null
      }
    };
  }
};

/**
 * Get vector coordinates for visualization
 * @param {Array<string>} words - Words to get coordinates for
 * @param {number} dimensions - Number of dimensions (2 or 3)
 * @returns {Promise<Object>} - Coordinates for visualization
 */
export const getVectorCoordinates = async (words, dimensions = 2) => {
  try {
    
    // Create a copy of words array to avoid modifying the original
    const wordsToProcess = [...words].slice(0, 20); // Limit to 20 words max
    
    const response = await apiRequest('getVectorCoordinates', 'post', { 
      words: wordsToProcess, 
      dimensions 
    });
    
    return response;
  } catch (error) {
    console.error('Error getting vector coordinates:', error);
    
    if (error.response?.status === 500 && error.response?.data?.isPineconeError) {
      return {
        error: 'Pinecone connection failed. Please check your API key configuration.',
        message: error.response.data.message || 'Pinecone service error',
        data: [],
        invalidWords: words
      };
    }
    
    // Return a standardized error response that the UI can handle
    return {
      error: 'Failed to calculate vector coordinates',
      message: error.message,
      data: [],
      invalidWords: words
    };
  }
};

/**
 * Find nearest neighbors for a word
 * @param {string} word - Word to find neighbors for
 * @param {number} numResults - Number of neighbors to return
 * @param {boolean} useExactSearch - Whether to use exact search
 * @returns {Promise<Object>} - Nearest neighbors
 */
export const findNeighbors = async (word, numResults = 5, useExactSearch = false) => {
  try {
    
    const response = await apiRequest('findNeighbors', 'post', {
      word,
      numResults,
      useExactSearch
    });
    
    return response;
  } catch (error) {
    console.error('Error finding neighbors:', error);
    return {
      error: 'Failed to find neighbors',
      message: error.message,
      data: { word, nearestWords: [] }
    };
  }
};

/**
 * Find midpoint between two words
 * @param {string} word1 - First word
 * @param {string} word2 - Second word
 * @param {number} numResults - Number of results to return
 * @param {number} recursionDepth - How many levels of midpoints to find
 * @param {boolean} useExactSearch - Whether to use exact search
 * @returns {Promise<Object>} - Midpoint results
 */
export const findMidpoint = async (
  word1,
  word2,
  numResults = 5,
  recursionDepth = 0,
  useExactSearch = true
) => {
  try {
    
    const response = await apiRequest('findMidpoint', 'post', {
      word1,
      word2,
      numResults,
      recursionDepth,
      useExactSearch
    });
    
    return response;
  } catch (error) {
    console.error('Error finding midpoint:', error);
    return {
      error: 'Failed to find midpoint',
      message: error.message,
      data: {
        primaryMidpoint: {
          word1, word2,
          nearestWords: []
        }
      }
    };
  }
};

/**
 * Find analogy completions: word1 is to word2 as word3 is to ?
 * @param {string} word1 - First word in the analogy
 * @param {string} word2 - Second word in the analogy
 * @param {string} word3 - Third word in the analogy
 * @param {number} numResults - Number of results to return
 * @param {boolean} useExactSearch - Whether to use exact search
 * @returns {Promise<Object>} - Analogy results
 */
export const findAnalogy = async (
  word1,
  word2,
  word3,
  numResults = 5,
  useExactSearch = true
) => {
  try {
    
    const response = await apiRequest('findAnalogy', 'post', {
      word1,
      word2,
      word3,
      numResults,
      useExactSearch
    });
    
    return response;
  } catch (error) {
    console.error('Error finding analogy:', error);
    return {
      error: 'Failed to calculate analogy',
      message: error.message,
      data: {
        analogy: `${word1} is to ${word2} as ${word3} is to ?`,
        results: []
      }
    };
  }
};

// Export all functions
export default {
  checkWord,
  getVectorCoordinates,
  findNeighbors,
  findMidpoint,
  findAnalogy
}; 
