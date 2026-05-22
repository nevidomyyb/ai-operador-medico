import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { register: reg, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      if (mode === 'login') {
        await login(data.email, data.password);
      } else {
        await register(data.name, data.email, data.password);
      }
      navigate('/nova-avaliacao');
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Erro ao autenticar. Verifique seus dados.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-blue-600 mb-1">MedAnalysis</div>
          <div className="text-gray-500 text-sm">Plataforma de Auditoria de Sinistros</div>
        </div>

        <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                {...reg('name', { required: true })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Seu nome"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              {...reg('email', { required: true })}
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              {...reg('password', { required: true })}
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
