import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Solo ejecutar en web
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }
    
    // DESHABILITAR SERVICE WORKER EN VERCEL TEMPORALMENTE
    const isVercel = window.location.hostname.includes('vercel.app') || 
                     window.location.hostname.includes('.vercel.app');
    
    if (isVercel) {
      console.log('Service Worker deshabilitado en Vercel para evitar recargas');
      return;
    }
    
    // Registrar service worker solo en local
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registrado exitosamente:', registration);
          
          // Verificar actualizaciones - SIN AUTO-RELOAD para evitar recargas problemáticas
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible - solo log, sin auto-reload
                console.log('Nueva versión de la app disponible. Recarga manualmente para actualizar.');
              }
            });
          });
        })
        .catch((error) => {
          console.log('SW registro fallido:', error);
        });
    }

    // Manejar evento de instalación
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Detectar si ya está instalada
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Verificar si está en modo standalone (instalada)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó la instalación');
        setIsInstalled(true);
      } else {
        console.log('Usuario rechazó la instalación');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error al instalar PWA:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    installPWA
  };
};

// Hook para detectar si está online/offline
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Solo ejecutar en web
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};