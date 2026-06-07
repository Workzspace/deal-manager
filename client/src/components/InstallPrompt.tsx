// "Install app" button for the PWA.
//
// On Android/desktop Chrome the browser fires a `beforeinstallprompt` event we
// can capture and trigger later from our own button. On iOS Safari there's no
// such event, so we show a short hint on how to add it to the home screen.
import { useEffect, useState } from 'react';

// The event isn't in the standard TS lib types, so we describe what we use.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  // Remember if the user dismissed it this session.
  const [hidden, setHidden] = useState(() => isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => setHidden(true));
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (hidden) return null;
  // Show the button only if the browser offered an install, or it's iOS (manual).
  if (!deferred && !isIos()) return null;

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setHidden(true);
    } else {
      setShowIosHint((v) => !v);
    }
  }

  return (
    <div className="install-pill">
      <button className="install-btn" onClick={handleClick}>
        ⤓ Install app
      </button>
      <button className="install-x" aria-label="Dismiss" onClick={() => setHidden(true)}>
        ✕
      </button>
      {showIosHint && (
        <p className="install-hint">
          Tap the Share button, then “Add to Home Screen”.
        </p>
      )}
    </div>
  );
}
