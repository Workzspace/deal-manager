// Login screen — a personal, single 4-digit PIN sign-in for the business owner.
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth';

const PIN_LENGTH = 4;
// The business owner this app belongs to (shown on the welcome screen).
const OWNER_NAME = 'Vinod Singla';

export default function Login() {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the (invisible) input focused so the keypad stays up on mobile.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(value: string) {
    setBusy(true);
    setError('');
    try {
      await login(value);
      // On success the app re-renders to the main screens automatically.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      setPin(''); // clear so they can retype
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (busy) return;
    const digits = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    setError('');
    if (digits.length === PIN_LENGTH) submit(digits);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo" role="img" aria-label="Property">
          🏡
        </div>

        <p className="login-eyebrow">Welcome back 👋</p>
        <h1 className="login-name">{OWNER_NAME}</h1>
        <p className="login-brand">
          <span className="brand-mark" aria-hidden="true" />
          Property Ledger · Bathinda
        </p>

        <div className="pin-area" onClick={() => inputRef.current?.focus()}>
          <p className="pin-label">Enter your 4-digit PIN to continue</p>

          <div className={`pin-boxes ${error ? 'pin-error' : ''}`}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`pin-box ${i < pin.length ? 'filled' : ''} ${
                  i === pin.length && !busy ? 'active' : ''
                }`}
              >
                {i < pin.length ? '•' : ''}
              </div>
            ))}
          </div>

          <input
            ref={inputRef}
            className="pin-input"
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={pin}
            onChange={handleChange}
            disabled={busy}
            aria-label="4-digit PIN"
          />

          {busy && <p className="muted pin-status">Checking…</p>}
          {error && <p className="form-error pin-status">{error}</p>}
        </div>
      </div>
    </div>
  );
}
