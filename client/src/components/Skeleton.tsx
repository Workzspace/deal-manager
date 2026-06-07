// Placeholder "shimmer" cards shown while data loads — feels more polished and
// app-like than a plain "Loading…" line, and hints at the layout to come.

export default function Skeleton({ variant = 'card', count = 3 }: { variant?: 'row' | 'area' | 'card'; count?: number }) {
  return (
    <div className={variant === 'card' ? 'cards' : 'list'}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`sk-card sk-${variant}`}>
          <div className="sk-line sk-title" />
          {variant === 'area' && (
            <div className="sk-stats">
              <div className="sk-box" />
              <div className="sk-box" />
              <div className="sk-box" />
              <div className="sk-box" />
            </div>
          )}
          {variant === 'card' && (
            <>
              <div className="sk-line sk-sub" />
              <div className="sk-line sk-wide" />
            </>
          )}
          {variant === 'row' && <div className="sk-line sk-sub" />}
        </div>
      ))}
    </div>
  );
}
