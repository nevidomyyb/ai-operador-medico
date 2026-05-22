import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const DECISION_LABELS = { APPROVED: 'Aprovado', REJECTED: 'Recusado', REVIEW: 'Em Revisão' };

export default function History() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (status) params.status = status;
      const res = await api.get('/predictions', { params });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    await api.delete(`/predictions/${deleteId}`);
    setDeleteId(null);
    load();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Histórico de Avaliações</h1>
      <p className="text-gray-500 text-sm mb-6">Consulte todas as avaliações realizadas</p>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="PROCESSING">Processando</option>
          <option value="COMPLETED">Concluído</option>
          <option value="FAILED">Erro</option>
        </select>
        <button onClick={load} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          Atualizar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16 text-gray-400">Carregando...</div>
        ) : data.items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Nenhuma avaliação encontrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Paciente</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo de Sinistro</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Recomendação</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Decisão</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Data</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.patient_data?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.patient_data?.ClaimType ?? '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3">
                    {item.result ? (
                      <span className={`font-medium ${item.result.approved ? 'text-green-600' : 'text-red-600'}`}>
                        {item.result.approved ? 'Aprovação' : 'Negação'} ({item.result.confidence}%)
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.decision ? DECISION_LABELS[item.decision] ?? item.decision : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      {item.status === 'COMPLETED' && (
                        <button
                          onClick={() => navigate(`/historico/${item.id}`)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Ver
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} total={data.total} perPage={10} onChange={setPage} />

      {deleteId && (
        <ConfirmModal
          title="Excluir avaliação"
          message="Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
