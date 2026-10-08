import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getApiUrl } from '../../utils/environment'; // Adjust path if necessary

// Async thunk to fetch word data if not cached
// We include 'exists' and 'vector' (truncated string)
export const fetchWordData = createAsyncThunk(
  'wordCache/fetchWordData',
  async (word, { getState, rejectWithValue }) => {
    const { wordCache } = getState();
    // Check cache first
    if (wordCache.data[word]) {
      return { word, data: wordCache.data[word], fromCache: true };
    }

    try {
      const response = await axios.post(getApiUrl('/api/checkWord'), { word });
      if (response.data && response.data.success) {
        // Return the word and its data (exists status and truncated vector)
        return { word, data: response.data.data.word, fromCache: false };
      } else {
        // Handle cases where API call succeeds but word doesn't exist logically
        return rejectWithValue({ word, error: 'API response indicates failure or missing data' });
      }
    } catch (error) {
      console.error(`Error fetching data for word "${word}":`, error.response?.data || error.message);
      return rejectWithValue({ word, error: error.response?.data?.error || error.message });
    }
  }
);

const initialState = {
  data: {}, // Stores word data: { word: { exists: boolean, vector: string | null } }
  status: {}, // Stores fetch status per word: { word: 'idle' | 'loading' | 'succeeded' | 'failed' }
  error: {}, // Stores error per word: { word: string | null }
};

export const wordCacheSlice = createSlice({
  name: 'wordCache',
  initialState,
  reducers: {
    // Optional: Reducer to clear cache or specific words if needed
    clearWordCache: (state) => {
      state.data = {};
      state.status = {};
      state.error = {};
    },
    invalidateWord: (state, action) => {
      const word = action.payload;
      if (word) {
        delete state.data[word];
        delete state.status[word];
        delete state.error[word];
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWordData.pending, (state, action) => {
        const word = action.meta.arg;
        state.status[word] = 'loading';
        state.error[word] = null; // Clear previous error on new fetch
      })
      .addCase(fetchWordData.fulfilled, (state, action) => {
        const { word, data, fromCache } = action.payload;
        state.status[word] = 'succeeded';
        // Only update cache if it wasn't a cache hit
        if (!fromCache) {
           state.data[word] = data; // Cache the received data (exists, vector)
        }
         state.error[word] = null; // Clear error on success
      })
      .addCase(fetchWordData.rejected, (state, action) => {
        const { word, error } = action.payload;
        state.status[word] = 'failed';
        state.error[word] = error || 'Failed to fetch word data';
      });
  },
});

// Export actions and reducer
export const { clearWordCache, invalidateWord } = wordCacheSlice.actions;
export default wordCacheSlice.reducer;

// Selector to get cached data for a specific word
export const selectWordData = (state, word) => state.wordCache.data[word];
export const selectWordStatus = (state, word) => state.wordCache.status[word];
export const selectWordError = (state, word) => state.wordCache.error[word];

