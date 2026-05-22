export default function Pagination({ page, total, perPage, onChange }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
      >
        Anterior
      </button>
      <span className="text-sm text-gray-600">{page} / {pages}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
      >
        Próxima
      </button>
    </div>
  );
}
