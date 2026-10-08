import React, { useState, useEffect, useRef } from 'react';
import './ToolbarStyles.css';
import styles from './AnalogySelection.module.css';

const AnalogySelection = ({
  selectedPoints,
  onReset,
  onCancel,
  onSearch,
  onWordInput,
  loading,
  analogyStep
}) => {
  // Local state for input fields
  const [word1, setWord1] = useState('');
  const [word2, setWord2] = useState('');
  const [word3, setWord3] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const input1Ref = useRef(null);
  const input2Ref = useRef(null);
  const input3Ref = useRef(null);

  // Sync local state with selectedPoints from visualization clicks
  useEffect(() => {
    if (selectedPoints.length >= 1) {
      setWord1(prev => selectedPoints[0] !== prev ? selectedPoints[0] : prev);
    }
    if (selectedPoints.length >= 2) {
      setWord2(prev => selectedPoints[1] !== prev ? selectedPoints[1] : prev);
    }
    if (selectedPoints.length >= 3) {
      setWord3(prev => selectedPoints[2] !== prev ? selectedPoints[2] : prev);
    }
  }, [selectedPoints]);

  // Auto-focus first empty field on mount
  useEffect(() => {
    if (!word1 && input1Ref.current) {
      input1Ref.current.focus();
    }
  }, []);

  // Handle input changes - lowercase only, trim on blur/submit
  const handleInputChange = (field, value) => {
    const cleanValue = value.toLowerCase();

    if (field === 1) {
      setWord1(cleanValue);
    } else if (field === 2) {
      setWord2(cleanValue);
    } else if (field === 3) {
      setWord3(cleanValue);
    }
  };

  // Handle Enter key to move to next field or trigger search
  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (field === 1 && word1) {
        if (onWordInput) onWordInput(word1, 0);
        input2Ref.current?.focus();
      } else if (field === 2 && word2) {
        if (onWordInput) onWordInput(word2, 1);
        input3Ref.current?.focus();
      } else if (field === 3 && word3 && word1 && word2) {
        if (onWordInput) onWordInput(word3, 2);
        handleSearch();
      }
    }
  };

  // Handle blur to trim and validate
  const handleBlur = (field) => {
    setFocusedField(null);
    // Trim on blur
    if (field === 1) {
      const trimmed = word1.trim();
      if (trimmed !== word1) setWord1(trimmed);
      if (trimmed && onWordInput) onWordInput(trimmed, 0);
    } else if (field === 2) {
      const trimmed = word2.trim();
      if (trimmed !== word2) setWord2(trimmed);
      if (trimmed && onWordInput) onWordInput(trimmed, 1);
    } else if (field === 3) {
      const trimmed = word3.trim();
      if (trimmed !== word3) setWord3(trimmed);
      if (trimmed && onWordInput) onWordInput(trimmed, 2);
    }
  };

  const handleSearch = () => {
    const w1 = word1.trim();
    const w2 = word2.trim();
    const w3 = word3.trim();

    if (w1 && w2 && w3 && onSearch) {
      onSearch(w1, w2, w3);
    }
  };

  const handleReset = () => {
    setWord1('');
    setWord2('');
    setWord3('');
    if (onReset) onReset();
    input1Ref.current?.focus();
  };

  const isComplete = word1 && word2 && word3;
  const showResult = analogyStep === 4;

  return (
    <div className={`toolbar compact ${styles.analogyToolbar}`}>
      <div className={styles.analogyInlineBar}>
        {/* Word 1 input */}
        <input
          ref={input1Ref}
          type="text"
          className={`${styles.analogyInput} ${word1 ? styles.filled : ''} ${focusedField === 1 ? 'focused' : ''}`}
          value={word1}
          onChange={(e) => handleInputChange(1, e.target.value)}
          onFocus={() => setFocusedField(1)}
          onBlur={() => handleBlur(1)}
          onKeyDown={(e) => handleKeyDown(e, 1)}
          placeholder="word"
          disabled={loading}
          autoComplete="off"
          spellCheck="false"
          aria-label="First word in analogy"
        />

        <span className={styles.analogyArrow}>→</span>

        {/* Word 2 input */}
        <input
          ref={input2Ref}
          type="text"
          className={`${styles.analogyInput} ${word2 ? styles.filled : ''} ${focusedField === 2 ? 'focused' : ''}`}
          value={word2}
          onChange={(e) => handleInputChange(2, e.target.value)}
          onFocus={() => setFocusedField(2)}
          onBlur={() => handleBlur(2)}
          onKeyDown={(e) => handleKeyDown(e, 2)}
          placeholder="word"
          disabled={loading}
          autoComplete="off"
          spellCheck="false"
          aria-label="Second word in analogy"
        />

        <span className={styles.analogyEquals}>≈</span>

        {/* Word 3 input */}
        <input
          ref={input3Ref}
          type="text"
          className={`${styles.analogyInput} ${word3 ? styles.filled : ''} ${focusedField === 3 ? 'focused' : ''}`}
          value={word3}
          onChange={(e) => handleInputChange(3, e.target.value)}
          onFocus={() => setFocusedField(3)}
          onBlur={() => handleBlur(3)}
          onKeyDown={(e) => handleKeyDown(e, 3)}
          placeholder="word"
          disabled={loading}
          autoComplete="off"
          spellCheck="false"
          aria-label="Third word in analogy"
        />

        <span className={styles.analogyArrow}>→</span>

        {/* Result placeholder */}
        <span className={styles.analogyResult}>
          {loading ? (
            <span className={styles.analogyLoading}>
              <span className={styles.loadingDot}></span>
              <span className={styles.loadingDot}></span>
              <span className={styles.loadingDot}></span>
            </span>
          ) : showResult ? (
            <span className={styles.resultWord}>results</span>
          ) : (
            <span className={styles.resultPlaceholder}>?</span>
          )}
        </span>

        {/* Action buttons */}
        <div className={styles.analogyActions}>
          {isComplete && !loading && !showResult && (
            <button
              className={styles.analogyGoBtn}
              onClick={handleSearch}
              title="Find analogy"
            >
              Go
            </button>
          )}

          {(word1 || word2 || word3) && !loading && (
            <button
              className={styles.analogyResetBtn}
              onClick={handleReset}
              title="Reset"
            >
              ×
            </button>
          )}

          <button
            className={styles.analogyCancelBtn}
            onClick={onCancel}
            disabled={loading}
            title="Cancel"
          >
            Done
          </button>
        </div>
      </div>

      {/* Hint text */}
      {!isComplete && !loading && (
        <div className={styles.analogyHint}>
          Type words or click points on the graph
        </div>
      )}

    </div>
  );
};

export default AnalogySelection;
