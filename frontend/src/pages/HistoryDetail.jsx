import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Result from './assessment/Result';

export default function HistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/predictions/${id}`)
      .then((res) => setPrediction(res.data))
      .catch(() => navigate('/historico'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  if (!prediction) return null;

  return (
    <div className="p-8">
      <button onClick={() => navigate('/historico')} className="text-blue-600 text-sm hover:underline mb-6 block">
        ← Voltar ao Histórico
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Detalhe da Avaliação</h1>
      <Result prediction={prediction} />
    </div>
  );
}
