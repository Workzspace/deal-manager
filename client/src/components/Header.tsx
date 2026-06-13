// Sticky top bar shown on every screen: optional back button, title, and a
// global search box.
//
// Two modes for the search box:
//  - "entry" mode (default, on cities/areas/deals pages): tapping the box opens
//    the dedicated Search screen. It does NOT search in place.
//  - "live" mode (on the Search screen, when `onSearchChange` is provided): the
//    box is controlled by the parent and updates local state on every keystroke
//    WITHOUT navigating — so the mobile keyboard stays up while you type.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  searchValue?: string;
  // Provide this to put the search box in live/controlled mode (Search screen).
  onSearchChange?: (value: string) => void;
  // Extra controls rendered under the title row (e.g. status filter).
  children?: ReactNode;
}

export default function Header({
  title,
  subtitle,
  onBack,
  searchValue = '',
  onSearchChange,
  children,
}: Props) {
  const navigate = useNavigate();
  const liveMode = typeof onSearchChange === 'function';
  const [entryValue, setEntryValue] = useState('');

  return (
    <header className="topbar">
      <div className="topbar-row">
        {onBack ? (
          <button className="icon-btn" aria-label="Back" onClick={onBack}>
            ‹
          </button>
        ) : (
          <span className="brand-dot" aria-hidden="true" />
        )}
        <div className="topbar-titles">
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="search-wrap">
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input
          className="search-input"
          type="search"
          placeholder="Search plots, sellers, buyers, areas…"
          value={liveMode ? searchValue : entryValue}
          autoFocus={liveMode}
          // Entry mode: opening the box takes you to the Search screen.
          onFocus={() => {
            if (!liveMode) navigate('/search');
          }}
          onChange={(e) => {
            if (liveMode) onSearchChange!(e.target.value);
            else setEntryValue(e.target.value);
          }}
        />
      </div>

      {children}
    </header>
  );
}
