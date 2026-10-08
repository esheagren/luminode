import { useState, useEffect } from 'react';

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    // Set initial value
    setMatches(media.matches);

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]); // Removed 'matches' to prevent memory leak from listener re-registration

  return matches;
};

export const useIsMobile = () => useMediaQuery('(max-width: 480px)');
