import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/nova-avaliacao', label: 'Nova Avaliação', icon: '✦' },
  { to: '/historico',      label: 'Histórico',      icon: '◷' },
  { to: '/usuarios',       label: 'Usuários',        icon: '◎' },
  { to: '/catalogos',      label: 'Catálogos',       icon: '▤' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="text-lg font-bold text-blue-400">MedAnalysis</div>
        <div className="text-xs text-gray-400 mt-0.5">Auditoria de Sinistros</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-1 truncate">{user?.email}</div>
        <div className="text-sm font-medium text-white truncate mb-3">{user?.name}</div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
