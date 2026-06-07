// Global search results across all plots, sellers, buyers and areas.
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import type { Deal, DealInput } from '../types';
import Header from '../components/Header';
import DealCard from '../components/DealCard';
import DealForm from '../components/DealForm';
import { useToast } from '../components/Toast';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const navigate = useNavigate();
  const toast = useToast();

  const [results, setResults] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Deal | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!q.trim()) {
      setResults([]);
      return;
    }
    // Small debounce so we don't fire a request on every keystroke.
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await api.search(q);
        if (!cancelled) {
          setResults(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Search failed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  async function handleSave(data: DealInput) {
    if (editing) await api.updateDeal(editing.id, data);
    setEditing(null);
    toast('Plot updated');
    // Refresh results to reflect the edit.
    if (q.trim()) setResults(await api.search(q));
  }

  async function handleDelete(deal: Deal) {
    await api.deleteDeal(deal.id);
    setEditing(null);
    toast('Plot deleted');
    if (q.trim()) setResults(await api.search(q));
  }

  return (
    <div className="page">
      <Header title="Search" searchValue={q} onBack={() => navigate(-1)} />

      <main className="content">
        {loading && <p className="muted center">Searching…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && q.trim() && results.length === 0 && (
          <p className="muted center">No results for “{q}”.</p>
        )}

        {!q.trim() && <p className="muted center">Type above to search across all your plots.</p>}

        {results.length > 0 && (
          <p className="muted result-count">
            {results.length} result{results.length === 1 ? '' : 's'} for “{q}”
          </p>
        )}

        <div className="cards">
          {results.map((deal) => (
            <DealCard key={deal.id} deal={deal} onEdit={setEditing} showLocation />
          ))}
        </div>
      </main>

      <DealForm
        open={!!editing}
        deal={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      />
    </div>
  );
}
