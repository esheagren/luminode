import React, { useState, useEffect } from 'react';
import { getRandomSuggestions } from '../data/suggestedWords';
import { hasPrecomputedEmbedding } from '../data/generatedEmbeddings';
import styles from './SuggestedWords.module.css';

const SuggestedWords = ({ onWordSelect, currentWords, numSuggestions = 8, compact = false }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate new word suggestions
  const refreshSuggestions = () => {
    setLoading(true);
    
    // Get random words from our curated list
    const candidateWords = getRandomSuggestions(numSuggestions * 2, currentWords);
    
    try {
      // Filter words that have pre-computed embeddings
      const validWords = candidateWords
        .filter(word => hasPrecomputedEmbedding(word))
        .slice(0, numSuggestions);
      
      setSuggestions(validWords);
    } catch (error) {
      console.error('Error refreshing suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh when currentWords changes
  useEffect(() => {
    refreshSuggestions();
  }, [currentWords, numSuggestions]);

  // Compact mode for mobile - just tiny pills in a row
  if (compact) {
    return (
      <div className={styles.compactSuggestions}>
        {suggestions.map((word, index) => (
          <button
            key={`word-${index}`}
            className={styles.compactWord}
            onClick={() => onWordSelect(word)}
          >
            {word}
          </button>
        ))}
        <button
          onClick={refreshSuggestions}
          className={styles.compactRefresh}
          disabled={loading}
          aria-label="Refresh suggestions"
        >
          ↻
        </button>

      </div>
    );
  }

  return (
    <div className={styles.suggestedWordsContainer}>
      <div className={styles.suggestedWordsHeader}>
        <h3>Suggested Words</h3>
        <button
          onClick={refreshSuggestions}
          className={styles.refreshBtn}
          title="Get new suggestions"
          disabled={loading}
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>

      <div className={styles.suggestedWordsList}>
        {suggestions.map((word, index) => (
          <div
            key={`word-${index}`}
            className={styles.suggestedWord}
            onClick={() => onWordSelect(word)}
          >
            {word}
          </div>
        ))}
        {suggestions.length === 0 && !loading && (
          <div className={styles.emptyMessage}>No suggestions available</div>
        )}
      </div>
      
    </div>
  );
};

export default SuggestedWords; 