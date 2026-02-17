import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('backButton', ({ canGoBack }) => {
      // If on home page, minimize the app instead of exiting
      if (location.pathname === '/' || location.pathname === '/auth') {
        App.minimizeApp();
      } else if (canGoBack) {
        navigate(-1);
      } else {
        App.minimizeApp();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate, location.pathname]);
}
