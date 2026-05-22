const MAP = {
  PROCESSING: { label: 'Processando', cls: 'bg-yellow-100 text-yellow-800' },
  COMPLETED:  { label: 'Concluído',   cls: 'bg-green-100 text-green-800' },
  FAILED:     { label: 'Erro',        cls: 'bg-red-100 text-red-800' },
};

export default function StatusBadge({ status }) {
  const { label, cls } = MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}
