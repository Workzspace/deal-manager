// A single deal shown as a colour-coded card.
import type { Deal } from '../types';
import { formatINR, formatSize } from '../format';
import StatusBadge from './StatusBadge';

interface Props {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  // When shown on the search page we want to display where the plot lives.
  showLocation?: boolean;
}

export default function DealCard({ deal, onEdit, showLocation }: Props) {
  const buyerCount = deal.buyers?.length || 0;
  // Highest offer among interested buyers, if any.
  const topOffer = deal.buyers?.reduce(
    (max, b) => (b.offer_amount && b.offer_amount > max ? b.offer_amount : max),
    0
  );

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

      <div className="card-bottom">
        {deal.seller_name ? (
          <span className="muted">
            Seller: {deal.seller_name}
            {deal.seller_phone && (
              <>
                {' · '}
                <a
                  href={`tel:${deal.seller_phone}`}
                  className="tel-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {deal.seller_phone}
                </a>
              </>
            )}
          </span>
        ) : (
          <span className="muted">No seller set</span>
        )}
        {buyerCount > 0 && (
          <span className="chip">
            {buyerCount} buyer{buyerCount > 1 ? 's' : ''}
            {topOffer ? ` · top ${formatINR(topOffer)}` : ''}
          </span>
        )}
      </div>
    </article>
  );
}
