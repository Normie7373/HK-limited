import { useState, useCallback, useRef, useEffect } from 'react';

export default function useResizeObserver() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const observerRef = useRef(null);

  const ref = useCallback((node) => {
    // If there is an existing observer, disconnect it
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // If a new DOM node is mounted, observe it
    if (node) {
      console.log('ResizeObserver: observing DOM node', node);
      const observer = new ResizeObserver((entries) => {
        if (!entries || !entries[0]) {
          console.warn('ResizeObserver: received empty entries');
          return;
        }
        const { width, height } = entries[0].contentRect;
        console.log('ResizeObserver: observed width =', width, 'height =', height);
        setDimensions({ width, height });
      });
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  // Ensure observer is disconnected when the component unmounts
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [ref, dimensions];
}
