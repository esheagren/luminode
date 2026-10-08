import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import VectorGraph from '../VectorGraph';
import styles from './Sandbox.module.css';

// An embedded "play" area inside a textbook chapter. It mounts the REAL
// VectorGraph (which fetches its own PCA coordinates from the API) scoped to a
// fixed-height container, seeded with a preset word list. Chapter-defined
// "+ word" buttons let the reader extend it, and "Open in explorer" hands the
// current words off to the full app at /app.
const Sandbox = ({ words: initialWords, addable = [], caption = '' }) => {
  const [words, setWords] = useState(initialWords);
  const navigate = useNavigate();

  const addWord = (word) => {
    setWords((prev) => (prev.includes(word) ? prev : [...prev, word]));
  };

  const openInExplorer = () => {
    navigate('/app', { state: { words } });
  };

  const remaining = addable.filter((w) => !words.includes(w));

  return (
    <div className={styles.tbSandbox}>
      <div className={styles.tbSandboxGraph}>
        <VectorGraph
          words={words}
          midpointWords={[]}
          numMidpoints={5}
          viewMode="2D"
          rulerActive={false}
          selectionMode={false}
          selectedPoints={[]}
          analogyMode={false}
          analogyStep={0}
          isSearchingAnalogy={false}
        />
      </div>

      <div className={styles.tbSandboxControls}>
        {remaining.map((word) => (
          <button
            key={word}
            className={styles.tbAddBtn}
            onClick={() => addWord(word)}
          >
            + {word}
          </button>
        ))}
        <button className={styles.tbOpenBtn} onClick={openInExplorer}>
          Open in explorer →
        </button>
      </div>

      {caption && <p className={styles.tbSandboxCaption}>{caption}</p>}

    </div>
  );
};

Sandbox.propTypes = {
  words: PropTypes.arrayOf(PropTypes.string).isRequired,
  addable: PropTypes.arrayOf(PropTypes.string),
  caption: PropTypes.string,
};

export default Sandbox;
