import { useEffect } from 'react';

export const useAutoUpdate = () => {
  useEffect(() => {
    let currentVersion: string | null = null;

    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            if (currentVersion === null) {
              currentVersion = data.version;
            } else if (currentVersion !== data.version) {
              console.log('⚡ Nova versão publicada detectada! Recarregando cliente...');
              window.location.reload();
            }
          }
        }
      } catch (e) {
        // Silently ignore offline network failures
      }
    };

    checkVersion();

    // Poll every 30 seconds for new build releases
    const interval = setInterval(checkVersion, 30000);

    // Also check when browser tab gains focus or comes back to foreground
    const handleFocus = () => {
      checkVersion();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
};
