import axios from 'axios';

/**
 * Finds the midpoint between two word vectors and the nearest word to that midpoint
 * 
 * @param {string} word1 - First word
 * @param {string} word2 - Second word
 * @param {number} recursionDepth - How many levels of midpoints to find (0 = just the direct midpoint)
 * @param {string} serverUrl - API server URL
 * @returns {Promise<Object>} - Midpoint search results
 */
export const findMidpoints = async (word1, word2, recursionDepth = 0, serverUrl) => {
  try {
    // Validate inputs
    if (!word1 || !word2) {
      throw new Error('Both words are required');
    }
    
    if (recursionDepth < 0 || recursionDepth > 2) {
      throw new Error('Recursion depth must be between 0 and 2');
    }
    
    
    // Call API to find the midpoint and nearest word
    const response = await axios.post(`${serverUrl}/api/findMidpoint`, {
      word1,
      word2,
      recursionDepth,
      numResults: 5 // Explicitly set numResults
    });
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from server');
    }
    
    return response.data.data;
  } catch (error) {
    // Add more specific error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Server error (${error.response.status}):`, error.response.data);
      
      if (error.response.status === 404) {
        console.error('API endpoint not found. Please check server configuration and routes.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};