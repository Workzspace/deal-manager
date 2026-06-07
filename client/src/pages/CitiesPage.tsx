// Top level: the list of cities.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { City } from '../types';
import Header from '../components/Header';
import NameForm from '../components/NameForm';
import Skeleton from '../components/Skeleton';
import { useToast } from '../components/Toast';

export default function CitiesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<City | null>(null);

  async function load() {
    try {
      setLoading(true);
      setCities(await api.listCities());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load cities.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setSheetOpen(true);
  }
  function openEdit(city: City, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(city);
    setSheetOpen(true);
  }

  async function handleSave(name: string) {
    if (editing) await api.updateCity(editing.id, name);
    else await api.createCity(name);
    setSheetOpen(false);
    toast(editing ? 'City updated' : 'City added');
    await load();
  }

  async function handleDelete() {
    if (!editing) return;
    await api.deleteCity(editing.id);
    setSheetOpen(false);
    toast('City deleted');
    await load();
  }

  return (
    <div className="page">
      <Header title="Property Ledger" subtitle="Your cities" />

      <main className="content">
        {loading && <Skeleton variant="row" count={3} />}
        {error && <p className="form-error">{error}</p>}

        {!loading && cities.length === 0 && (
          <div className="empty">
            <div className="empty-emoji">🏙️</div>
            <p>No cities yet</p>
            <p className="muted">Add a city to start tracking plots there.</p>
            <button className="btn btn-primary" onClick={openNew}>
              Add your first city
            </button>
          </div>
        )}

        <div className="list">
          {cities.map((city) => (
            <div key={city.id} className="row-card" onClick={() => navigate(`/cities/${city.id}`)}>
              <div>
                <h3>{city.name}</h3>
                <p className="muted">
                  {city.area_count || 0} area{city.area_count === 1 ? '' : 's'}
                </p>
              </div>
              <div className="row-actions">
                <button className="icon-btn" aria-label="Edit city" onClick={(e) => openEdit(city, e)}>
                  ✎
                </button>
                <span className="chevron">›</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button className="fab" aria-label="Add city" onClick={openNew}>
        +
      </button>

      <NameForm
        open={sheetOpen}
        title={editing ? 'Edit City' : 'New City'}
        label="City name"
        initialValue={editing?.name || ''}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
        deleteLabel={`Delete city "${editing?.name}"`}
      />
    </div>
  );
}
