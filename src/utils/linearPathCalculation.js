import axios from 'axios';
import { getApiUrl } from './environment';

/**
 * Finds a linear interpolation path through the vector space between two words
 *
 * @param {string} word1 - First word (starting point)
 * @param {string} word2 - Second word (ending point)
 * @param {number} numSteps - Number of interpolation steps
 * @returns {Promise<Object>} - Linear path results
 */
export const findLinearPath = async (word1, word2, numSteps = 10) => {
  try {

    if (!word1 || !word2) {
      throw new Error('Both words are required for linear path calculation');
    }

    const apiUrl = getApiUrl('/api/findLinearPath');

    const response = await axios.post(apiUrl, {
      word1,
      word2,
      numSteps
    });

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Error finding linear path:', error);

    if (error.response) {
      console.error('Server response:', error.response.data);
      if (error.response.status === 404) {
        throw new Error(`Server error (404): ${error.response.data?.error || 'Endpoint not found'}`);
      }
    }

    throw new Error(`Failed to find linear path: ${error.message}`);
  }
};

/**
 * Process linear path API response into visualization-ready format
 *
 * @param {Object} results - Linear path results from API
 * @param {string} word1 - First source word
 * @param {string} word2 - Second source word
 * @returns {Object} - Formatted linear path cluster for visualization
 */
export const processLinearPathResults = (results, word1, word2) => {
  const linearPathCluster = {
    type: 'linearPath',
    source: {
      word1,
      word2,
      numSteps: results.numSteps
    },
    words: []
  };

  // Process path points
  if (results.pathPoints && results.pathPoints.length > 0) {
    results.pathPoints.forEach((point, index) => {
      const isEndpoint = index === 0 || index === results.pathPoints.length - 1;

      linearPathCluster.words.push({
        word: point.word,
        isLinearPath: true,
        isEndpoint: isEndpoint,
        pathIndex: index,
        t: point.t,
        similarity: point.similarity,
        similarityToLine: point.similarityToLine
      });
    });
  }

  return linearPathCluster;
};
