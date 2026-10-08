import React, { useState, useRef, useEffect } from 'react';
// import axios from 'axios'; // No longer needed for checkWord here
import { useDispatch } from 'react-redux'; // Import Redux hook
import { fetchWordData } from '../features/wordCache/wordCacheSlice'; // Import the async thunk
import styles from './WordInput.module.css';

const WordInput = ({ 
  words, 
  setWords, 
  setError, 
  loading,
  setRelatedClusters,
  showWordTags = true
}) => {
  const [wordInput, setWordInput] = useState('');
  // const [invalidWords, setInvalidWords] = useState([]); // Seems unused
  const inputRef = useRef(null);
  const dispatch = useDispatch(); // Get dispatch function

  // Determine placeholder text based on number of words
  const getPlaceholderText = () => {
    return words.length < 2 ? "Add 2+ Words" : "Add Another Word";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wordInput.trim()) return;
    
    const word = wordInput.trim().toLowerCase();
    
    // Check if word is already in the list
    if (words.includes(word)) {
      setError(`"${word}" is already in your list`);
      return;
    }
    
    // Reset previous errors
    setError(null);
    // setLoading(true); // Loading is handled by the slice
    
    dispatch(fetchWordData(word))
      .unwrap() // Use unwrap to easily handle resolved/rejected state
      .then(result => {
        // Check existence from the thunk result
        if (result.data.exists) {
          // Add word to the list (managed by HomePage)
          const updatedWords = [...words, word];
          setWords(updatedWords);
          
          // Store word data in response (no longer directly setting response here)
          // setResponse(prev => ({ ... })); 
          
          // Clear any existing related clusters (assuming this prop is still valid)
          if (setRelatedClusters) {
             setRelatedClusters([]);
          }
          
          // Clear input
          setWordInput('');
        } else {
          // Word doesn't exist in embeddings
          setError(`"${word}" is not in our dictionary`);
          // Clear input even when word is not found
          setWordInput('');
        }
      })
      .catch(fetchError => {
        // Handle error from the thunk
        console.error('[WordInput] Error adding word via thunk:', fetchError);
        setError(fetchError.error || `Error adding "${word}"`);
      });
      // .finally(() => { // Loading is handled by the slice
      //   setLoading(false);
      // });

    // Note: The original handleSubmit had logic to update visualization
    // after removing a word. That logic seems misplaced here and was removed
    // during previous edits or was incomplete. Removing words is handled
    // directly in the JSX below now.
  };

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Maintain focus after any state changes
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    // Use requestAnimationFrame to ensure focus happens after DOM updates
    requestAnimationFrame(focusInput);
  }, [words, wordInput, loading]);

  return (
    <div className={styles.wordInputContainer}>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={wordInput}
          onChange={(e) => setWordInput(e.target.value)}
          placeholder={getPlaceholderText()}
          disabled={loading}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSubmit(e);
            }
          }}
        />
      </form>
      
      {showWordTags && words.length > 0 && (
        <div className={styles.selectedWords}>
          {words.map((word, index) => (
            <div key={`word-${index}`} className={styles.wordTag}>
              {word}
              <button
                className={styles.removeWord}
                onClick={() => {
                  const newWords = [...words];
                  newWords.splice(index, 1);
                  setWords(newWords);
                  // Clear related clusters when all words are removed
                  if (newWords.length === 0 && setRelatedClusters) {
                    setRelatedClusters([]);
                  }
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
};

export default WordInput; 
