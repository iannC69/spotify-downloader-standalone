import { useState, useEffect } from 'react';

// Secret sequence: i a n n c
const SECRET_CODE = ['i', 'a', 'n', 'n', 'c'];

export default function useKonamiCode() {
  const [success, setSuccess] = useState(false);
  const [, setInputSequence] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      
      setInputSequence((prev) => {
        const newSequence = [...prev, key];
        
        // Keep the sequence length to the secret code's length
        if (newSequence.length > SECRET_CODE.length) {
          newSequence.shift();
        }

        // Check if the current sequence matches the secret code
        if (newSequence.join('') === SECRET_CODE.join('')) {
          setSuccess(true);
        }

        return newSequence;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return success;
}
