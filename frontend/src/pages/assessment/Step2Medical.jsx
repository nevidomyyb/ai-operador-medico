import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/client';

const SPECIALTY_OPTIONS = ['Cardiologia', 'Clínica Geral', 'Neurologia', 'Ortopedia', 'Pediatria'];
const CLAIM_TYPE_OPTIONS = ['Emergência', 'Internação', 'Ambulatorial', 'Consulta de Rotina'];
const SUBMISSION_OPTIONS = ['Online', 'Telefone', 'Papel/Correio'];
const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function AutocompleteField({ label, endpoint, error, onSelect, defaultCode, defaultName }) {
  const [query, setQuery] = useState(defaultName ?? '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const res = await api.get(endpoint, { params: { search: query, per_page: 8 } });
        setResults(res.data.items ?? []);
        setOpen(true);
      } catch { setResults([]); }
    }, 300);
  }, [query]);

  const choose = (item) => {
    setQuery(`${item.code} — ${item.name_ptbr}`);
    setOpen(false);
    onSelect(item.code);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); if (!e.target.value) onSelect(''); }}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-gray-300'}`}
        placeholder="Digite código ou nome..."
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {error && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
      {open && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {results.map((item) => (
            <li
              key={item.code}
              onMouseDown={() => choose(item)}
              className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
            >
              <span className="font-mono text-blue-700 mr-2">{item.code}</span>
              <span className="text-gray-700">{item.name_ptbr}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Step2Medical({ defaultValues, onBack, onSubmit: onFormSubmit, submitting }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ defaultValues });

  const inputCls = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-400' : 'border-gray-300'}`;

  const Field = ({ label, error, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Especialidade" error={errors.ProviderSpecialty}>
          <select {...register('ProviderSpecialty', { required: true })} className={inputCls(errors.ProviderSpecialty)}>
            <option value="">Selecione</option>
            {SPECIALTY_OPTIONS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Tipo de Sinistro" error={errors.ClaimType}>
          <select {...register('ClaimType', { required: true })} className={inputCls(errors.ClaimType)}>
            <option value="">Selecione</option>
            {CLAIM_TYPE_OPTIONS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <input type="hidden" {...register('DiagnosisCode', { required: true })} />
          <AutocompleteField
            label="Código ICD-10 (Diagnóstico)"
            endpoint="/catalogs/diagnoses"
            error={errors.DiagnosisCode}
            defaultCode={defaultValues?.DiagnosisCode}
            defaultName={defaultValues?._DiagnosisName}
            onSelect={(code) => setValue('DiagnosisCode', code, { shouldValidate: true })}
          />
        </div>
        <div>
          <input type="hidden" {...register('ProcedureCode', { required: true })} />
          <AutocompleteField
            label="Código TUSS (Procedimento)"
            endpoint="/catalogs/procedures"
            error={errors.ProcedureCode}
            defaultCode={defaultValues?.ProcedureCode}
            defaultName={defaultValues?._ProcedureName}
            onSelect={(code) => setValue('ProcedureCode', code, { shouldValidate: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Canal de Submissão" error={errors.ClaimSubmissionMethod}>
          <select {...register('ClaimSubmissionMethod', { required: true })} className={inputCls(errors.ClaimSubmissionMethod)}>
            <option value="">Selecione</option>
            {SUBMISSION_OPTIONS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Estado do Prestador" error={errors.ProviderState}>
          <select {...register('ProviderState', { required: true })} className={inputCls(errors.ProviderState)}>
            <option value="">Selecione</option>
            {UF_LIST.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Valor do Sinistro (R$)" error={errors.claim_amount_brl}>
          <input type="number" min="0" step="0.01" {...register('claim_amount_brl', { required: true, valueAsNumber: true })} className={inputCls(errors.claim_amount_brl)} placeholder="1500.00" />
        </Field>
        <Field label="Data de Solicitação" error={errors.request_date}>
          <input type="date" {...register('request_date', { required: true })} className={inputCls(errors.request_date)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Data Sugerida para Procedimento">
          <input type="date" {...register('suggested_date')} className={inputCls()} />
        </Field>
        <div></div>
      </div>

      <Field label="Notas Adicionais">
        <textarea {...register('additional_notes')} rows={3} className={inputCls()} placeholder="Observações relevantes..." />
      </Field>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          ← Voltar
        </button>
        <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {submitting ? 'Enviando...' : 'Enviar Avaliação'}
        </button>
      </div>
    </form>
  );
}
