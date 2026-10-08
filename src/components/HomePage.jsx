import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchWordData } from '../features/wordCache/wordCacheSlice';
import VectorGraph from './VectorGraph';
import WordInput from './WordInput';
import Tools from './Tools';
import ViewButton from './ViewButton';
import SuggestedWords from './SuggestedWords';
import { Link, useLocation } from 'react-router-dom';
import LearnPanel from './learn-panel/LearnPanel';
import IntroModal from './IntroModal';
import luminodeLogo from '../assets/luminodeLogoSmall.png';
import { useIsMobile } from '../hooks/useMediaQuery';
import styles from './HomePage.module.css';

// Add reset icon component
const ResetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);

const HomePage = () => {
  const [words, setWords] = useState([]);
  const [relatedClusters, setRelatedClusters] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const numNeighbors = 5; // Default number of neighbours/midpoints requested
  const [viewMode, setViewMode] = useState('2D'); // Default to 2D view
  const [rulerActive, setRulerActive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [analogyMode, setAnalogyMode] = useState(false);
  const [analogyStep, setAnalogyStep] = useState(0);
  const [isSearchingAnalogy, setIsSearchingAnalogy] = useState(false);
  const [sliceMode, setSliceMode] = useState(false);
  const [linearPathMode, setLinearPathMode] = useState(false);
  const [greedyPathMode, setGreedyPathMode] = useState(false);
  const [projectionMode, setProjectionMode] = useState(false);
  const [learnMode, setLearnMode] = useState(false);
  const [activeTool, setActiveTool] = useState('Vector Embeddings');
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Close sidebar when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile]); // Removed sidebarOpen to prevent potential infinite loops

  // Seed words handed off from the interactive textbook ("Open in explorer").
  useEffect(() => {
    const handoffWords = location.state?.words;
    if (Array.isArray(handoffWords) && handoffWords.length > 0) {
      setWords(handoffWords);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  // Close sidebar on Escape key for accessibility
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [sidebarOpen]);
  
  // Check if this is the first visit and show intro modal
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('luminode_has_seen_intro');
    // Don't interrupt an intentional handoff from the textbook ("Open in explorer")
    // with onboarding — the user already arrived with words to explore.
    const fromTextbookHandoff = location.state?.words?.length > 0;
    // Show intro modal if user hasn't seen it before or is coming from landing page
    if (!fromTextbookHandoff && (!hasSeenIntro || location.state?.fromLanding)) {
      setShowIntroModal(true);
      // Mark that the user has seen the intro
      localStorage.setItem('luminode_has_seen_intro', 'true');
    }
  }, [location]);
  
  // Handle closing the intro modal
  const handleCloseIntroModal = () => {
    setShowIntroModal(false);
  };
  
  // Wrapper for setRelatedClusters (previously had debug logging)
  const updateRelatedClusters = (newClusters) => {
    setRelatedClusters(newClusters);
  };

  const handleWordSelect = (word) => {
    if (!words.includes(word)) {
      const updatedWords = [...words, word];
      setWords(updatedWords);
      
      setError(null);

      dispatch(fetchWordData(word))
        .unwrap()
        .catch((fetchError) => {
          console.error('[HomePage] Error fetching word data via thunk:', fetchError);
          setError(fetchError.error || 'Failed to check word existence.');
        });
    }
  };
  
  // Handle point selection from the graph
  const handlePointSelected = (word) => {
    if (!selectionMode && !analogyMode && !sliceMode && !linearPathMode && !greedyPathMode && !projectionMode) {
      return;
    }

    
    if (analogyMode) {
      // Analogy mode selection logic
      if (selectedPoints.includes(word)) {
        setError("Each word can only be used once in an analogy");
        return; // Already selected
      }
      
      // We need at most 3 words for analogy
      if (selectedPoints.length >= 3) {
        return;
      }
      
      // Clear any previous errors
      if (error) setError(null);
      
      // Add the new word to selected points
      const newSelection = [...selectedPoints, word];
      setSelectedPoints(newSelection);
      
      // Log immediately after setting
      setTimeout(() => {
      }, 0);
      
      return;
    }
    
    if (projectionMode) {
      // Projection mode: first 2 points are axis, then unlimited projection words
      if (error) setError(null);

      if (selectedPoints.includes(word)) {
        setSelectedPoints(selectedPoints.filter(p => p !== word));
      } else {
        setSelectedPoints([...selectedPoints, word]);
      }
      return;
    }

    if (selectionMode || sliceMode || linearPathMode || greedyPathMode) {
      // Clear any previous errors
      if (error) setError(null);

      // Midpoint, Slice, Linear Path, or Greedy Path selection logic - they work the same way
      if (selectedPoints.includes(word)) {
        setSelectedPoints(selectedPoints.filter(p => p !== word));
      } else if (selectedPoints.length < 2) {
        setSelectedPoints([...selectedPoints, word]);
      } else {
        // Replace oldest point
        setSelectedPoints([selectedPoints[1], word]);
      }
    }
  };
  
  // Unified selection mode setter — activates one mode and deactivates all others.
  // This replaces five nearly-identical functions that each had to know about every other mode.
  const setToolSelectionMode = (mode, active, step = 0) => {
    const modes = {
      selection: setSelectionMode,
      analogy: setAnalogyMode,
      slice: setSliceMode,
      linearPath: setLinearPathMode,
      greedyPath: setGreedyPathMode,
      projection: setProjectionMode,
    };

    // Set the target mode
    modes[mode](active);

    // Analogy has extra state
    if (mode === 'analogy') {
      setAnalogyStep(step);
      if (!active) setIsSearchingAnalogy(false);
    }

    if (!active) {
      setSelectedPoints([]);
    }

    // Turn off all other modes when activating
    if (active) {
      setSelectedPoints([]);
      for (const [key, setter] of Object.entries(modes)) {
        if (key !== mode) setter(false);
      }
      // Always reset analogy step when switching away from analogy
      if (mode !== 'analogy') setAnalogyStep(0);
    }
  };

  // Convenience wrappers to preserve the existing prop interface
  const setPointSelectionMode = (active) => setToolSelectionMode('selection', active);
  const setAnalogySelectionMode = (active, step = 0) => setToolSelectionMode('analogy', active, step);
  const setSliceSelectionMode = (active) => setToolSelectionMode('slice', active);
  const setLinearPathSelectionMode = (active) => setToolSelectionMode('linearPath', active);
  const setGreedyPathSelectionMode = (active) => setToolSelectionMode('greedyPath', active);
  const setProjectionSelectionMode = (active) => setToolSelectionMode('projection', active);
  
  // Updated set searching analogy state
  const setSearchingAnalogy = (isSearching) => {
    setIsSearchingAnalogy(isSearching);
  };

  // Handle Reset functionality
  const handleReset = () => {
    
    // Clear all words
    setWords([]);
    
    // Clear visualizations/clusters
    setRelatedClusters([]);
    
    // Reset selection modes
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedPoints([]);
    }
    
    // Reset analogy mode
    if (analogyMode) {
      setAnalogyMode(false);
      setAnalogyStep(0);
      setSelectedPoints([]);
      setIsSearchingAnalogy(false);
    }

    // Reset slice mode
    if (sliceMode) {
      setSliceMode(false);
      setSelectedPoints([]);
    }

    // Reset linear path mode
    if (linearPathMode) {
      setLinearPathMode(false);
      setSelectedPoints([]);
    }

    // Reset greedy path mode
    if (greedyPathMode) {
      setGreedyPathMode(false);
      setSelectedPoints([]);
    }

    // Reset projection mode
    if (projectionMode) {
      setProjectionMode(false);
      setSelectedPoints([]);
    }

    // Clear any errors
    setError(null);
  };

  // Mobile-specific layout: Graph on top, input at bottom
  if (isMobile) {
    return (
      <div className={styles.mobileAppContainer}>
        {/* Graph area - takes most of the screen */}
        <div className={styles.mobileGraphArea}>
          <VectorGraph
            words={words}
            midpointWords={relatedClusters}
            numMidpoints={numNeighbors}
            viewMode={viewMode}
            rulerActive={rulerActive}
            selectionMode={selectionMode || sliceMode || linearPathMode || greedyPathMode || projectionMode}
            onPointSelected={handlePointSelected}
            selectedPoints={selectedPoints}
            analogyMode={analogyMode}
            analogyStep={analogyStep}
            isSearchingAnalogy={isSearchingAnalogy}
          />

          {/* Floating 2D/3D toggle */}
          <div className={styles.mobileViewToggle}>
            <ViewButton
              viewMode={viewMode}
              setViewMode={setViewMode}
              isCompact={true}
            />
          </div>

          {/* Floating info button for sidebar */}
          <button
            className={styles.mobileInfoButton}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>

        {/* Selected words bar - shows current words */}
        {words.length > 0 && (
          <div className={styles.mobileWordsBar}>
            <div className={styles.mobileWordsScroll}>
              {words.map((word, index) => (
                <div key={`word-${index}`} className={styles.mobileWordTag}>
                  {word}
                  <button
                    className={styles.mobileRemoveWord}
                    onClick={() => {
                      const newWords = [...words];
                      newWords.splice(index, 1);
                      setWords(newWords);
                      // Clear related clusters when all words are removed
                      if (newWords.length === 0) {
                        setRelatedClusters([]);
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              className={styles.mobileResetBtn}
              onClick={handleReset}
              title="Reset all"
            >
              <ResetIcon />
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className={styles.mobileError}>
            {error}
          </div>
        )}

        {/* Tools bar - always visible */}
        <div className={styles.mobileToolsBar}>
          <Tools
            words={words}
            numMidpoints={numNeighbors}
            setMidpointClusters={updateRelatedClusters}
            setLoading={setIsLoading}
            setError={setError}
            loading={isLoading}
            viewMode={viewMode}
            setViewMode={setViewMode}
            rulerActive={rulerActive}
            setRulerActive={setRulerActive}
            selectionMode={selectionMode}
            setSelectionMode={setPointSelectionMode}
            selectedPoints={selectedPoints}
            setSelectedPoints={setSelectedPoints}
            analogyMode={analogyMode}
            setAnalogyMode={setAnalogySelectionMode}
            analogyStep={analogyStep}
            setAnalogyStep={setAnalogyStep}
            isSearchingAnalogy={isSearchingAnalogy}
            setIsSearchingAnalogy={setSearchingAnalogy}
            sliceMode={sliceMode}
            setSliceMode={setSliceSelectionMode}
            linearPathMode={linearPathMode}
            setLinearPathMode={setLinearPathSelectionMode}
            greedyPathMode={greedyPathMode}
            setGreedyPathMode={setGreedyPathSelectionMode}
            projectionMode={projectionMode}
            setProjectionMode={setProjectionSelectionMode}
            learnMode={learnMode}
            setLearnMode={setLearnMode}
            setActiveTool={setActiveTool}
            hideViewButton={true}
          />
        </div>

        {/* Bottom input bar */}
        <div className={styles.mobileBottomBar}>
          <div className={styles.mobileInputRow}>
            <WordInput
              words={words}
              setWords={setWords}
              setError={setError}
              loading={false}
              setRelatedClusters={setRelatedClusters}
              showWordTags={false}
            />
          </div>

          {/* Quick suggested words - compact pills */}
          <SuggestedWords
            onWordSelect={handleWordSelect}
            currentWords={words}
            numSuggestions={5}
            compact={true}
          />
        </div>

        {/* Slide-out sidebar for full options */}
        <div
          className={`${styles.mobileSidebarOverlay} ${sidebarOpen ? styles.visible : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
        <div className={`${styles.mobileSidebar} ${sidebarOpen ? styles.open : ''}`}>
          <div className={styles.mobileSidebarHeader}>
            <Link to="/" className={styles.mobileLogoLink}>
              <img src={luminodeLogo} alt="Luminode" />
              <span>Luminode</span>
            </Link>
            <button
              className={styles.mobileCloseSidebar}
              onClick={() => setSidebarOpen(false)}
            >
              ×
            </button>
          </div>

          <div className={styles.mobileSidebarContent}>
            <h3>All Suggested Words</h3>
            <SuggestedWords
              onWordSelect={(word) => {
                handleWordSelect(word);
                setSidebarOpen(false);
              }}
              currentWords={words}
              numSuggestions={12}
            />
          </div>

          <div className={styles.mobileSidebarFooter}>
            <a href="https://eriksheagren.notion.site" target="_blank" rel="noopener noreferrer">
              Contact
            </a>
            <a href="https://github.com/esheagren/Luminode" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>

        {/* Learn panel as modal on mobile */}
        {learnMode && (
          <div className={styles.mobileLearnModal}>
            <LearnPanel
              activeTool={activeTool}
              onClose={() => setLearnMode(false)}
            />
          </div>
        )}

        {/* Intro Modal */}
        <IntroModal
          isOpen={showIntroModal}
          onClose={handleCloseIntroModal}
        />

      </div>
    );
  }

  // Desktop/Tablet layout
  return (
    <div className={styles.appContainer}>
      <div className={styles.mainLayout}>
        <div id="mobile-sidebar" className={styles.sidebar}>
          <div className={styles.logoContainer}>
            <Link to="/" className={styles.logoLink}>
              <img src={luminodeLogo} alt="Luminode" />
              <span className={styles.logoText}>Luminode</span>
            </Link>
          </div>

          <div className={styles.inputWrapper}>
            <WordInput
              words={words}
              setWords={setWords}
              setError={setError}
              loading={false}
              setRelatedClusters={setRelatedClusters}
              showWordTags={false}
            />
            <button
              className={styles.resetButton}
              onClick={handleReset}
              title="Reset words"
            >
              <ResetIcon />
            </button>
          </div>

          <div className={styles.wordsContainer}>
            {words.length > 0 && (
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
                        if (newWords.length === 0) {
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

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.suggestionsSection}>
            <SuggestedWords
              onWordSelect={handleWordSelect}
              currentWords={words}
              numSuggestions={8}
            />
          </div>
        </div>

        <div className={styles.contentArea}>
          <div className={styles.toolsBar}>
            <Tools
              words={words}
              numMidpoints={numNeighbors}
              setMidpointClusters={updateRelatedClusters}
              setLoading={setIsLoading}
              setError={setError}
              loading={isLoading}
              viewMode={viewMode}
              setViewMode={setViewMode}
              rulerActive={rulerActive}
              setRulerActive={setRulerActive}
              selectionMode={selectionMode}
              setSelectionMode={setPointSelectionMode}
              selectedPoints={selectedPoints}
              setSelectedPoints={setSelectedPoints}
              analogyMode={analogyMode}
              setAnalogyMode={setAnalogySelectionMode}
              analogyStep={analogyStep}
              setAnalogyStep={setAnalogyStep}
              isSearchingAnalogy={isSearchingAnalogy}
              setIsSearchingAnalogy={setSearchingAnalogy}
              sliceMode={sliceMode}
              setSliceMode={setSliceSelectionMode}
              linearPathMode={linearPathMode}
              setLinearPathMode={setLinearPathSelectionMode}
              greedyPathMode={greedyPathMode}
              setGreedyPathMode={setGreedyPathSelectionMode}
              projectionMode={projectionMode}
              setProjectionMode={setProjectionSelectionMode}
              learnMode={learnMode}
              setLearnMode={setLearnMode}
              setActiveTool={setActiveTool}
            />
          </div>

          <div className={`${styles.graphAndLearnContainer} ${learnMode ? styles.withLearnPanel : ''}`}>
            <div className={`${styles.graphArea} ${learnMode ? styles.withLearnPanel : ''}`}>
              <VectorGraph
                words={words}
                midpointWords={relatedClusters}
                numMidpoints={numNeighbors}
                viewMode={viewMode}
                rulerActive={rulerActive}
                selectionMode={selectionMode || sliceMode || linearPathMode || greedyPathMode || projectionMode} // Treat slice mode similar to selection mode
                onPointSelected={handlePointSelected}
                selectedPoints={selectedPoints}
                analogyMode={analogyMode}
                analogyStep={analogyStep}
                isSearchingAnalogy={isSearchingAnalogy}
              />
            </div>

            {learnMode && (
              <div className={styles.learnPanelContainer}>
                <LearnPanel
                  activeTool={activeTool}
                  onClose={() => setLearnMode(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intro Modal */}
      <IntroModal
        isOpen={showIntroModal}
        onClose={handleCloseIntroModal}
      />

      {/* Footer Links */}
      <footer className={styles.homeFooter}>
        <div className={styles.footerLinks}>
          <a href="https://eriksheagren.notion.site" target="_blank" rel="noopener noreferrer">
            Contact
          </a>
          <a href="https://github.com/esheagren/Luminode" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </footer>
      
    </div>
  );
};

export default HomePage; 
