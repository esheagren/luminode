import axios from 'axios';
import { getApiUrl } from './environment';

/**
 * Projects words onto a semantic axis defined by two endpoint words.
 *
 * @param {string} axisWord1 - First axis word (the "from" direction)
 * @param {string} axisWord2 - Second axis word (the "to" direction)
 * @param {string[]} wordsToProject - Words to project onto the axis
 * @returns {Promise<Object>} - Axis projection results
 */
export const findAxisProjection = async (axisWord1, axisWord2, wordsToProject) => {
  try {

    if (!axisWord1 || !axisWord2) {
      throw new Error('Both axis words are required');
    }
    if (!wordsToProject || wordsToProject.length === 0) {
      throw new Error('At least one word to project is required');
    }

    const apiUrl = getApiUrl('/api/findAxisProjection');
    const response = await axios.post(apiUrl, {
      axisWord1,
      axisWord2,
      wordsToProject
    });

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Error finding axis projection:', error);

    if (error.response) {
      console.error('Server response:', error.response.data);
      if (error.response.status === 404) {
        throw new Error(`Server error (404): ${error.response.data?.error || 'Endpoint not found'}`);
      }
    }

    throw new Error(`Failed to find axis projection: ${error.message}`);
  }
};

/**
 * Process axis projection API response into visualization-ready format
 *
 * @param {Object} results - Axis projection results from API
 * @param {string} axisWord1 - First axis word
 * @param {string} axisWord2 - Second axis word
 * @returns {Object} - Formatted axis projection cluster for visualization
 */
export const processAxisProjectionResults = (results, axisWord1, axisWord2) => {
  const axisProjectionCluster = {
    type: 'axisProjection',
    source: {
      axisWord1,
      axisWord2
    },
    words: [
      // Axis endpoints
      { word: axisWord1, isAxisProjection: true, isEndpoint: true, position: 0 },
      { word: axisWord2, isAxisProjection: true, isEndpoint: true, position: 1 },
    ]
  };

  // Add projected words
  if (results.projections && results.projections.length > 0) {
    results.projections.forEach(proj => {
      axisProjectionCluster.words.push({
        word: proj.word,
        isAxisProjection: true,
        isEndpoint: false,
        position: proj.position,
        perpendicularDistance: proj.perpendicularDistance
      });
    });
  }

  return axisProjectionCluster;
};
