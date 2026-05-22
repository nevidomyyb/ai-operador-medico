import { useForm } from 'react-hook-form';

const GENDER_OPTIONS = ['Masculino', 'Feminino'];
const MARITAL_OPTIONS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)'];
const EMPLOYMENT_OPTIONS = ['Empregado', 'Desempregado', 'Aposentado', 'Estudante'];
const EDUCATION_OPTIONS = ['Fundamental', 'Médio', 'Superior', 'Pós-graduação'];
const PLAN_OPTIONS = ['Individual', 'Familiar', 'Empresarial', 'MEI'];

export default function Step1Patient({ defaultValues, onNext }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  const Field = ({ label, error, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error.message ?? 'Campo obrigatório'}</p>}
    </div>
  );

  const inputCls = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-400' : 'border-gray-300'}`;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome Completo" error={errors.full_name}>
          <input {...register('full_name', { required: true })} className={inputCls(errors.full_name)} placeholder="Nome do paciente" />
        </Field>
        <Field label="CPF" error={errors.cpf}>
          <input {...register('cpf', { required: true })} className={inputCls(errors.cpf)} placeholder="000.000.000-00" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Data de Nascimento" error={errors.birth_date}>
          <input type="date" {...register('birth_date', { required: true })} className={inputCls(errors.birth_date)} />
        </Field>
        <Field label="Sexo" error={errors.PatientGender}>
          <select {...register('PatientGender', { required: true })} className={inputCls(errors.PatientGender)}>
            <option value="">Selecione</option>
            {GENDER_OPTIONS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Estado Civil" error={errors.PatientMaritalStatus}>
          <select {...register('PatientMaritalStatus', { required: true })} className={inputCls(errors.PatientMaritalStatus)}>
            <option value="">Selecione</option>
            {MARITAL_OPTIONS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Número de Filhos" error={errors.ChildrenCount}>
          <input type="number" min="0" max="5" {...register('ChildrenCount', { required: true, valueAsNumber: true, min: 0, max: 5 })} className={inputCls(errors.ChildrenCount)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Renda Mensal (R$)" error={errors.income_monthly_brl}>
          <input type="number" min="0" step="0.01" {...register('income_monthly_brl', { required: true, valueAsNumber: true })} className={inputCls(errors.income_monthly_brl)} placeholder="5000.00" />
        </Field>
        <Field label="Propriedade do Imóvel" error={errors.IsHomeOwner}>
          <select {...register('IsHomeOwner', { required: true, setValueAs: (v) => v === '1' })} className={inputCls(errors.IsHomeOwner)}>
            <option value="">Selecione</option>
            <option value="1">Sim</option>
            <option value="0">Não</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Situação de Emprego" error={errors.PatientEmploymentStatus}>
          <select {...register('PatientEmploymentStatus', { required: true })} className={inputCls(errors.PatientEmploymentStatus)}>
            <option value="">Selecione</option>
            {EMPLOYMENT_OPTIONS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Escolaridade" error={errors.EducationLevel}>
          <select {...register('EducationLevel', { required: true })} className={inputCls(errors.EducationLevel)}>
            <option value="">Selecione</option>
            {EDUCATION_OPTIONS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo de Plano" error={errors.PlanType}>
          <select {...register('PlanType', { required: true })} className={inputCls(errors.PlanType)}>
            <option value="">Selecione</option>
            {PLAN_OPTIONS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Anos no Plano" error={errors.YearsAsInsured}>
          <input type="number" min="1" max="81" {...register('YearsAsInsured', { required: true, valueAsNumber: true, min: 1 })} className={inputCls(errors.YearsAsInsured)} />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="chronic" {...register('HasChronicCondition', { setValueAs: Boolean })} className="rounded" />
        <label htmlFor="chronic" className="text-sm text-gray-700">Paciente possui condição crônica</label>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
          Próximo →
        </button>
      </div>
    </form>
  );
}
