// A single deal shown as a colour-coded card with all its details:
// size, prices, seller, every interested buyer, and notes — laid out in clean,
// labelled sections so a broker can scan everything at a glance.
import type { Deal } from '../types';
import { formatINR, formatSize } from '../format';
import StatusBadge from './StatusBadge';

interface Props {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  // When shown on the search page we also display where the plot lives.
  showLocation?: boolean;
}

// Stop a tap on a phone link from also opening the edit sheet.
const stop = (e: React.MouseEvent) => e.stopPropagation();

export default function DealCard({ deal, onEdit, showLocation }: Props) {
  const buyers = deal.buyers || [];

  return (
    <article className={`card status-${deal.status}`} onClick={() => onEdit(deal)}>
      <div className="card-top">
        <div>
          <h3 className="card-title">{deal.plot_no}</h3>
          {showLocation && (deal.area_name || deal.city_name) && (
            <p className="card-location">
              {deal.area_name}
              {deal.city_name ? ` · ${deal.city_name}` : ''}
            </p>
          )}
        </div>
        <StatusBadge status={deal.status} />
      </div>

      <p className="card-size">{formatSize(deal)}</p>

      <div className="card-prices">
        <div>
          <span className="label">Asking</span>
          <strong>{formatINR(deal.asking_price)}</strong>
        </div>
        <div>
          <span className="label">Expected</span>
          <strong>{formatINR(deal.expected_price)}</strong>
        </div>
      </div>

      {/* Seller */}
      <div className="card-section">
        <span className="card-section-label">Seller</span>
        {deal.seller_name ? (
          <p className="card-section-value">
            {deal.seller_name}
            {deal.seller_phone && (
              <>
                {' · '}
                <a className="tel-link" href={`tel:${deal.seller_phone}`} onClick={stop}>
                  {deal.seller_phone}
                </a>
              </>
            )}
          </p>
        ) : (
          <p className="card-section-value muted">Not set</p>
        )}
      </div>

      {/* Interested buyers */}
      {buyers.length > 0 && (
        <div className="card-section">
          <span className="card-section-label">
            Interested buyers ({buyers.length})
          </span>
          <ul className="buyer-list">
            {buyers.map((b, i) => (
              <li key={i} className="buyer-item">
                <div className="buyer-line">
                  <span className="buyer-name">{b.name}</span>
                  {b.offer_amount != null && (
                    <span className="buyer-offer">{formatINR(b.offer_amount)}</span>
                  )}
                </div>
                {(b.phone || b.note) && (
                  <div className="buyer-sub">
                    {b.phone && (
                      <a className="tel-link" href={`tel:${b.phone}`} onClick={stop}>
                        {b.phone}
                      </a>
                    )}
                    {b.note && (
                      <span className="buyer-note">
                        {b.phone ? ' · ' : ''}
                        {b.note}
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {deal.notes && (
        <div className="card-section">
          <span className="card-section-label">Notes</span>
          <p className="card-notes">{deal.notes}</p>
        </div>
      )}
    </article>
  );
}
