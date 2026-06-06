// Third level: the plots (deals) inside an area, as colour-coded cards.
// Includes a status filter and an area stats summary.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Area, Deal, DealInput, DealStatus } from '../types';
import { STATUS_LABELS, STATUS_ORDER } from '../format';
import Header from '../components/Header';
import DealCard from '../components/DealCard';
import DealForm from '../components/DealForm';

type Filter = 'all' | DealStatus;

export default function DealsPage() {
  const { areaId } = useParams();
  const id = Number(areaId);
  const navigate = useNavigate();

  const [area, setArea] = useState<Area | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);

  async function load() {
    try {
      setLoading(true);
      const [areaData, dealList] = await Promise.all([api.getArea(id), api.listDeals(id)]);
      setArea(areaData);
      setDeals(dealList);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load plots.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Per-status counts, calculated from the loaded deals so they update instantly.
  const stats = useMemo(() => {
    const s = { total: deals.length, available: 0, negotiation: 0, hold: 0, sold: 0 };
    for (const d of deals) s[d.status]++;
    return s;
  }, [deals]);

  const visible = filter === 'all' ? deals : deals.filter((d) => d.status === filter);

  function openNew() {
    setEditing(null);
    setSheetOpen(true);
  }
  function openEdit(deal: Deal) {
    setEditing(deal);
    setSheetOpen(true);
  }

  async function handleSave(data: DealInput) {
    if (editing) await api.updateDeal(editing.id, data);
    else await api.createDeal(id, data);
    setSheetOpen(false);
    await load();
  }

  async function handleDelete(deal: Deal) {
    await api.deleteDeal(deal.id);
    setSheetOpen(false);
    await load();
  }

  return (
    <div className="page">
      <Header
        title={area?.name || 'Area'}
        subtitle={area?.city?.name}
        onBack={() => navigate(area ? `/cities/${area.city_id}` : '/')}
      >
        <div className="filter-bar">
          <button className={`chip-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({stats.total})
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              className={`chip-btn chip-${s} ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {STATUS_LABELS[s]} ({stats[s]})
            </button>
          ))}
        </div>
      </Header>

      <main className="content">
        {loading && <p className="muted center">Loading…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && deals.length === 0 && (
          <div className="empty">
            <p>No plots in this area yet.</p>
            <p className="muted">Tap + to add your first plot.</p>
          </div>
        )}

        {!loading && deals.length > 0 && visible.length === 0 && (
          <p className="muted center">No plots match this filter.</p>
        )}

        <div className="cards">
          {visible.map((deal) => (
            <DealCard key={deal.id} deal={deal} onEdit={openEdit} />
          ))}
        </div>
      </main>

      <button className="fab" aria-label="Add plot" onClick={openNew}>
        +
      </button>

      <DealForm
        open={sheetOpen}
        deal={editing}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      />
    </div>
  );
}
