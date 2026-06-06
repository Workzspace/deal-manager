// Sticky top bar shown on every screen: optional back button, title, a logout
// button, and a global search box that jumps to the search page as you type.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  // Set the search box's starting text (used on the search page itself).
  searchValue?: string;
  // Extra controls rendered under the title row (e.g. status filter).
  children?: ReactNode;
}

export default function Header({ title, subtitle, onBack, searchValue = '', children }: Props) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [q, setQ] = useState(searchValue);

  function onSearch(value: string) {
    setQ(value);
    const trimmed = value.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

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
        <button className="icon-btn" aria-label="Log out" title="Log out" onClick={logout}>
          ⏻
        </button>
      </div>

      <div className="search-wrap">
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input
          className="search-input"
          type="search"
          placeholder="Search plots, sellers, buyers, areas…"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {children}
    </header>
  );
}
