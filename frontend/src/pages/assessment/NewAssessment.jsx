import { useState } from 'react';
import api from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import Step1Patient from './Step1Patient';
import Step2Medical from './Step2Medical';
import Result from './Result';

const STEPS = ['Dados do Paciente', 'Solicitação Médica', 'Resultado'];

export default function NewAssessment() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [predictionId, setPredictionId] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  usePolling(
    predictionId && !prediction ? predictionId : null,
    (data) => setPrediction(data),
    (data) => { setError(data.error_message ?? 'Erro ao processar avaliação.'); setPredictionId(null); }
  );

  const handleStep1 = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(1);
  };

  const handleStep2 = async (data) => {
    const merged = { ...formData, ...data };

    // Coerce select string → boolean
    merged.IsHomeOwner = merged.IsHomeOwner === '1' || merged.IsHomeOwner === true;

    // Remove empty-string optional fields so Pydantic receives null, not ""
    const OPTIONAL_FIELDS = ['suggested_date', 'additional_notes', 'request_date'];
    OPTIONAL_FIELDS.forEach((k) => { if (merged[k] === '') merged[k] = null; });

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/predictions', merged);
      setPredictionId(res.data.id);
      setStep(2);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Pydantic validation errors — extract field + message
        setError(detail.map((e) => `${e.loc?.slice(-1)[0] ?? 'campo'}: ${e.msg}`).join(' | '));
      } else {
        setError(typeof detail === 'string' ? detail : 'Erro ao enviar avaliação.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nova Avaliação</h1>
      <p className="text-gray-500 text-sm mb-6">Preencha os dados para análise de sinistro</p>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              i < step ? 'bg-blue-600 text-white' :
              i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`ml-2 text-sm ${i === step ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`mx-4 flex-1 h-px ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: 40 }} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {step === 0 && <Step1Patient defaultValues={formData} onNext={handleStep1} />}

        {step === 1 && (
          <Step2Medical
            defaultValues={formData}
            onBack={() => setStep(0)}
            onSubmit={handleStep2}
            submitting={submitting}
          />
        )}

        {step === 2 && !prediction && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-600 text-sm">Processando avaliação com o modelo de IA...</p>
          </div>
        )}

        {step === 2 && prediction && <Result prediction={prediction} />}
      </div>
    </div>
  );
}
