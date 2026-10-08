import axios from 'axios';
import { getApiUrl } from './environment';

/**
 * Finds a greedy path through semantic neighbors from one word to another
 *
 * @param {string} word1 - First word (starting point)
 * @param {string} word2 - Second word (target point)
 * @param {number} maxHops - Maximum number of hops to take
 * @returns {Promise<Object>} - Greedy path results
 */
export const findGreedyPath = async (word1, word2, maxHops = 20) => {
  try {

    if (!word1 || !word2) {
      throw new Error('Both words are required for greedy path calculation');
    }

    const apiUrl = getApiUrl('/api/findGreedyPath');

    const response = await axios.post(apiUrl, {
      word1,
      word2,
      maxHops
    });

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Error finding greedy path:', error);

    if (error.response) {
      console.error('Server response:', error.response.data);
      if (error.response.status === 404) {
        throw new Error(`Server error (404): ${error.response.data?.error || 'Endpoint not found'}`);
      }
    }

    throw new Error(`Failed to find greedy path: ${error.message}`);
  }
};

/**
 * Process greedy path API response into visualization-ready format
 *
 * @param {Object} results - Greedy path results from API
 * @param {string} word1 - First source word
 * @param {string} word2 - Second source word
 * @returns {Object} - Formatted greedy path cluster for visualization
 */
export const processGreedyPathResults = (results, word1, word2) => {
  const greedyPathCluster = {
    type: 'greedyPath',
    source: {
      word1,
      word2,
      maxHops: results.maxHops
    },
    words: []
  };

  // Process path points
  if (results.pathPoints && results.pathPoints.length > 0) {
    results.pathPoints.forEach((point, index) => {
      const isEndpoint = index === 0 || index === results.pathPoints.length - 1;

      greedyPathCluster.words.push({
        word: point.word,
        isGreedyPath: true,
        isEndpoint: isEndpoint,
        pathIndex: index,
        hop: point.hop,
        similarityToTarget: point.similarityToTarget
      });
    });
  }

  return greedyPathCluster;
};
