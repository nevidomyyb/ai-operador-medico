import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import NewAssessment from './pages/assessment/NewAssessment';
import History from './pages/History';
import HistoryDetail from './pages/HistoryDetail';
import Users from './pages/Users';
import Catalogs from './pages/catalogs/Catalogs';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/nova-avaliacao" replace />} />
            <Route path="nova-avaliacao" element={<NewAssessment />} />
            <Route path="historico" element={<History />} />
            <Route path="historico/:id" element={<HistoryDetail />} />
            <Route path="usuarios" element={<Users />} />
            <Route path="catalogos" element={<Catalogs />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
