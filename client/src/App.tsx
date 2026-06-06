// Top-level component: decides between the login screen and the main app,
// and wires up the page routes.
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './auth';
import Login from './pages/Login';
import CitiesPage from './pages/CitiesPage';
import AreasPage from './pages/AreasPage';
import DealsPage from './pages/DealsPage';
import SearchPage from './pages/SearchPage';

// When the app opens, jump straight into the default city (Bathinda) so the
// broker lands on their areas immediately instead of a city list.
function HomeRedirect() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listCities()
      .then((cities) => {
        if (cities.length === 0) {
          // No cities yet — send them to the list so they can add one.
          navigate('/cities', { replace: true });
          return;
        }
        // Prefer the city literally named "Bathinda"; otherwise the first one.
        const def =
          cities.find((c) => c.name.trim().toLowerCase() === 'bathinda') || cities[0];
        navigate(`/cities/${def.id}`, { replace: true });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load.'));
  }, [navigate]);

  return (
    <div className="page">
      <main className="content">
        <p className="muted center">{error || 'Loading…'}</p>
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthed } = useAuth();

  // Not logged in → only the login screen is reachable.
  if (!isAuthed) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/cities" element={<CitiesPage />} />
      <Route path="/cities/:cityId" element={<AreasPage />} />
      <Route path="/areas/:areaId" element={<DealsPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
