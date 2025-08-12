import { useState, useCallback } from 'react';
import type { Route } from '@/types';

export function useNavigation() {
  const [route, setRoute] = useState<Route>('home');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigateTo = useCallback((newRoute: Route) => {
    setRoute(newRoute);
    setMobileOpen(false);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  return {
    route,
    mobileOpen,
    navigateTo,
    toggleMobile,
    closeMobile: () => setMobileOpen(false)
  };
}
