// Second level: the areas/colonies inside a city, each with a stats summary.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Area, City } from '../types';
import { formatINR } from '../format';
import Header from '../components/Header';
import NameForm from '../components/NameForm';

export default function AreasPage() {
  const { cityId } = useParams();
  const id = Number(cityId);
  const navigate = useNavigate();

  const [city, setCity] = useState<City | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);

  async function load() {
    try {
      setLoading(true);
      const [cities, areaList] = await Promise.all([api.listCities(), api.listAreas(id)]);
      setCity(cities.find((c) => c.id === id) || null);
      setAreas(areaList);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load areas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openNew() {
    setEditing(null);
    setSheetOpen(true);
  }
  function openEdit(area: Area, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(area);
    setSheetOpen(true);
  }

  async function handleSave(name: string) {
    if (editing) await api.updateArea(editing.id, name);
    else await api.createArea(id, name);
    setSheetOpen(false);
    await load();
  }

  async function handleDelete() {
    if (!editing) return;
    await api.deleteArea(editing.id);
    setSheetOpen(false);
    await load();
  }

  return (
    <div className="page">
      <Header
        title={city?.name || 'City'}
        subtitle="Areas & colonies"
        onBack={() => navigate('/')}
      />

      <main className="content">
        {loading && <p className="muted center">Loading…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && areas.length === 0 && (
          <div className="empty">
            <p>No areas yet.</p>
            <p className="muted">Add a colony or area to start adding plots.</p>
          </div>
        )}

        <div className="list">
          {areas.map((area) => {
            const s = area.stats;
            return (
              <div key={area.id} className="area-card" onClick={() => navigate(`/areas/${area.id}`)}>
                <div className="area-card-head">
                  <h3>{area.name}</h3>
                  <div className="row-actions">
                    <button className="icon-btn" aria-label="Edit area" onClick={(e) => openEdit(area, e)}>
                      ✎
                    </button>
                    <span className="chevron">›</span>
                  </div>
                </div>

                <div className="stat-grid">
                  <div className="stat">
                    <strong>{s?.total || 0}</strong>
                    <span>Plots</span>
                  </div>
                  <div className="stat stat-available">
                    <strong>{s?.available || 0}</strong>
                    <span>Available</span>
                  </div>
                  <div className="stat stat-negotiation">
                    <strong>{s?.negotiating || 0}</strong>
                    <span>Negotiating</span>
                  </div>
                  <div className="stat stat-sold">
                    <strong>{s?.closed || 0}</strong>
                    <span>Closed</span>
                  </div>
                </div>

                <div className="portfolio">
                  <span className="muted">Active portfolio</span>
                  <strong>{formatINR(s?.active_value)}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <button className="fab" aria-label="Add area" onClick={openNew}>
        +
      </button>

      <NameForm
        open={sheetOpen}
        title={editing ? 'Edit Area' : 'New Area'}
        label="Area / colony name"
        initialValue={editing?.name || ''}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
        deleteLabel={`Delete area "${editing?.name}"`}
      />
    </div>
  );
}
