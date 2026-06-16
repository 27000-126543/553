import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard3D from '@/pages/Dashboard3D';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard3D />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
