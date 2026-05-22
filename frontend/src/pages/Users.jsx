import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/client';
import ConfirmModal from '../components/ConfirmModal';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | user object
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.items ?? res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing('new'); reset({}); setError(''); };
  const openEdit = (u) => { setEditing(u); reset({ name: u.name, email: u.email }); setError(''); };
  const close = () => { setEditing(null); reset({}); };

  const onSubmit = async (data) => {
    setError('');
    try {
      if (editing === 'new') {
        await api.post('/users', data);
      } else {
        await api.put(`/users/${editing.id}`, data);
      }
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Erro ao salvar usuário.');
    }
  };

  const handleDelete = async () => {
    await api.delete(`/users/${deleteId}`);
    setDeleteId(null);
    load();
  };

  const inputCls = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-400' : 'border-gray-300'}`;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os usuários do sistema</p>
        </div>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16 text-gray-400">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Nenhum usuário encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">E-mail</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Criado em</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline text-xs">Editar</button>
                      <button onClick={() => setDeleteId(u.id)} className="text-red-500 hover:underline text-xs">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editing === 'new' ? 'Novo Usuário' : 'Editar Usuário'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input {...register('name', { required: true })} className={inputCls(errors.name)} placeholder="Nome completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input type="email" {...register('email', { required: true })} className={inputCls(errors.email)} placeholder="email@exemplo.com" />
              </div>
              {editing === 'new' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input type="password" {...register('password', { required: true })} className={inputCls(errors.password)} placeholder="••••••••" />
                </div>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50">
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Excluir usuário"
          message="Tem certeza que deseja excluir este usuário?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
