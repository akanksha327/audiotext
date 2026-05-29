import { Routes, Route, Navigate } from 'react-router-dom';
import LandingLayout from '../layouts/LandingLayout.jsx';
import LandingPage from '../pages/LandingPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      {/* UNIFIED SINGLE-PAGE PLATFORM */}
      <Route element={<LandingLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* FALLBACK CATCHALL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

