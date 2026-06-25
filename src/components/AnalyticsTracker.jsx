import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { addDoc, collection, doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const toolRoutes = {
  '/tools/update-maker': 'update-maker',
  '/tools/todo-maker': 'todo-maker',
  '/downloader': 'youtube-downloader',
  '/cutter': 'mp3-cutter',
  '/spotify': 'spotify-downloader',
  '/pomodoro': 'pomodoro',
  '/link-hub': 'link-hub',
  '/discord-embed': 'discord-embed',
  '/qr-studio': 'qr-studio',
  '/wildfire-overlay': 'wildfire-overlay',
};

const getDateKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getVisitorId = () => {
  const key = 'iannc-visitor-id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const next = crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(key, next);
  return next;
};

const cleanRouteKey = (pathname) => {
  const key = pathname === '/' ? 'home' : pathname.replace(/^\/+/, '');
  return key.replace(/[^a-zA-Z0-9_-]/g, '_') || 'home';
};

export default function AnalyticsTracker() {
  const location = useLocation();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (location.pathname.startsWith('/admin')) return;

    const trackPageView = async () => {
      try {
        const dateKey = getDateKey();
        const visitorId = getVisitorId();
        const toolId = toolRoutes[location.pathname] || null;
        const routeKey = cleanRouteKey(location.pathname);
        const visitorRef = doc(db, 'analyticsVisitors', `${dateKey}_${visitorId}`);
        const visitorSnapshot = await getDoc(visitorRef);
        const isNewDailyVisitor = !visitorSnapshot.exists();

        const dailyPayload = {
          date: dateKey,
          totalViews: increment(1),
          [`routes.${routeKey}`]: increment(1),
          updatedAt: serverTimestamp(),
        };

        if (isNewDailyVisitor) {
          dailyPayload.uniqueVisitors = increment(1);
          await setDoc(visitorRef, {
            date: dateKey,
            visitorId,
            firstPath: location.pathname,
            userId: user?.id || null,
            createdAt: serverTimestamp(),
          });
        }

        if (toolId) {
          dailyPayload.totalToolViews = increment(1);
          dailyPayload[`tools.${toolId}.views`] = increment(1);
          dailyPayload[`tools.${toolId}.lastPath`] = location.pathname;
        }

        await setDoc(doc(db, 'analyticsDaily', dateKey), dailyPayload, { merge: true });

        await addDoc(collection(db, 'analyticsEvents'), {
          type: toolId ? 'tool_view' : 'page_view',
          path: location.pathname,
          routeKey,
          toolId,
          visitorId,
          userId: user?.id || null,
          userEmail: user?.primaryEmailAddress?.emailAddress || null,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.warn('Analytics tracking skipped:', error);
      }
    };

    trackPageView();
  }, [isLoaded, location.pathname, user]);

  return null;
}
