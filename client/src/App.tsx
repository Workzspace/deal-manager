// Top-level component: decides between the login screen and the main app,
// and wires up the page routes.
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Login from './pages/Login';
import CitiesPage from './pages/CitiesPage';
import AreasPage from './pages/AreasPage';
import DealsPage from './pages/DealsPage';
import SearchPage from './pages/SearchPage';

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
      <Route path="/" element={<CitiesPage />} />
      <Route path="/cities/:cityId" element={<AreasPage />} />
      <Route path="/areas/:areaId" element={<DealsPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
