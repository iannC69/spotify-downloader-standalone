import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SiteConfigContext } from './siteConfigInstance';

export default function SiteConfigProvider({ children }) {
  const [siteConfig, setSiteConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'siteData', 'general'),
      (snapshot) => {
        if (snapshot.exists()) setSiteConfig(snapshot.data());
        setLoading(false);
      },
      (error) => {
        console.warn('SiteConfig listener error:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <SiteConfigContext.Provider value={{ siteConfig, loading }}>
      {children}
    </SiteConfigContext.Provider>
  );
}
