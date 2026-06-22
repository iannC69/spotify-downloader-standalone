import { useContext } from 'react';
import { SiteConfigContext } from './siteConfigInstance';

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
