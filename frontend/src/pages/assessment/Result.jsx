import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

const DECISION_MAP = {
  APPROVED: { label: 'Aprovado', cls: 'bg-green-100 text-green-800 border-green-200' },
  REJECTED: { label: 'Recusado', cls: 'bg-red-100 text-red-800 border-red-200' },
  REVIEW:   { label: 'Em Revisão', cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
};

export default function Result({ prediction }) {
  const { result, id, patient_data } = prediction;
  const navigate = useNavigate();
  const [decision, setDecision] = useState(prediction.decision ?? null);
  const [saving, setSaving] = useState(false);

  const approved = result?.approved;
  const confidence = result?.confidence ?? 0;
  const positive = result?.factors?.positive ?? [];
  const attention = result?.factors?.attention ?? [];

  const makeDecision = async (d) => {
    setSaving(true);
    try {
      await api.patch(`/predictions/${id}/decision`, { decision: d });
      setDecision(d);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Banner */}
      <div className={`rounded-xl p-6 flex items-center justify-between ${approved ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div>
          <div className={`text-2xl font-bold ${approved ? 'text-green-700' : 'text-red-700'}`}>
            {approved ? '✓ Recomendação: Aprovação' : '✗ Recomendação: Negação'}
          </div>
          <div className={`text-sm mt-1 ${approved ? 'text-green-600' : 'text-red-600'}`}>
            Confiança do modelo: {confidence}%
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Paciente: {patient_data?.full_name}
          </div>
        </div>
        <div className={`text-6xl font-bold opacity-20 ${approved ? 'text-green-600' : 'text-red-600'}`}>
          {approved ? '✓' : '✗'}
        </div>
      </div>

      {/* Factors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-green-700 mb-3">Fatores Positivos</h3>
          {positive.length === 0
            ? <p className="text-gray-400 text-sm">Nenhum fator positivo identificado.</p>
            : positive.map((f, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-green-500 text-sm mt-0.5">✓</span>
                <span className="text-sm text-gray-700">{f}</span>
              </div>
            ))
          }
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-orange-600 mb-3">Fatores de Atenção</h3>
          {attention.length === 0
            ? <p className="text-gray-400 text-sm">Nenhum fator de atenção identificado.</p>
            : attention.map((f, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-orange-500 text-sm mt-0.5">⚠</span>
                <span className="text-sm text-gray-700">{f}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Decision */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Decisão do Auditor</h3>
        {decision ? (
          <div className={`inline-flex items-center px-4 py-2 rounded-lg border text-sm font-medium ${DECISION_MAP[decision]?.cls}`}>
            Decisão registrada: {DECISION_MAP[decision]?.label}
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => makeDecision('APPROVED')} disabled={saving} className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              Aprovar
            </button>
            <button onClick={() => makeDecision('REJECTED')} disabled={saving} className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              Recusar
            </button>
            <button onClick={() => makeDecision('REVIEW')} disabled={saving} className="px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
              Revisar
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-400 flex justify-between items-center">
        <span>Modelo: {result?.model ?? 'ExtraTreesClassifier'}</span>
        <span>{new Date(prediction.created_at).toLocaleString('pt-BR')}</span>
      </div>

      <div className="flex gap-3 pb-6">
        <button onClick={() => navigate('/nova-avaliacao')} className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          Nova Avaliação
        </button>
        <button onClick={() => navigate('/historico')} className="text-blue-600 text-sm hover:underline px-2 py-2">
          Ver Histórico
        </button>
      </div>
    </div>
  );
}
