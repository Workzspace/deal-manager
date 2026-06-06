// Login screen — a single shared 4-digit PIN for the whole business.
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth';

const PIN_LENGTH = 4;

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
    // Keep digits only, max 4.
    const digits = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    setError('');
    if (digits.length === PIN_LENGTH) submit(digits);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">PL</div>
        <h1>Property Ledger</h1>
        <p className="muted">Deal Management</p>

        <div className="pin-area" onClick={() => inputRef.current?.focus()}>
          <p className="pin-label">Enter your 4-digit PIN</p>

          {/* Visible PIN boxes (filled dots reflect how many digits typed) */}
          <div className={`pin-boxes ${error ? 'pin-error' : ''}`}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div key={i} className={`pin-box ${i < pin.length ? 'filled' : ''} ${i === pin.length && !busy ? 'active' : ''}`}>
                {i < pin.length ? '•' : ''}
              </div>
            ))}
          </div>

          {/* The real input is invisible but captures typing & the numeric keypad */}
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
