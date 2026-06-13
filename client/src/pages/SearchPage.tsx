// Global search across all plots, sellers, buyers and areas.
//
// The query lives in LOCAL state and updates as you type — it never navigates
// the router per keystroke, so the input keeps focus and the mobile keyboard
// stays up. The URL's ?q= is only read once (so shared/deep links still work).
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import type { Deal, DealInput } from '../types';
import Header from '../components/Header';
import DealCard from '../components/DealCard';
import DealForm from '../components/DealForm';
import { useToast } from '../components/Toast';

export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Initial query comes from the URL once; after that it's purely local.
  const initialQuery = useRef(params.get('q') || '').current;
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Deal | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    // Debounce so we don't fire a request on every keystroke.
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await api.search(query);
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
  }, [query]);

  async function refresh() {
    if (query.trim()) setResults(await api.search(query));
  }

  async function handleSave(data: DealInput) {
    if (editing) await api.updateDeal(editing.id, data);
    setEditing(null);
    toast('Plot updated');
    await refresh();
  }

  async function handleDelete(deal: Deal) {
    await api.deleteDeal(deal.id);
    setEditing(null);
    toast('Plot deleted');
    await refresh();
  }

  return (
    <div className="page">
      <Header title="Search" searchValue={query} onSearchChange={setQuery} onBack={() => navigate(-1)} />

      <main className="content">
        {loading && <p className="muted center">Searching…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && query.trim() && results.length === 0 && (
          <p className="muted center">No results for “{query}”.</p>
        )}

        {!query.trim() && (
          <p className="muted center">Type above to search across all your plots.</p>
        )}

        {results.length > 0 && (
          <p className="muted result-count">
            {results.length} result{results.length === 1 ? '' : 's'} for “{query}”
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
