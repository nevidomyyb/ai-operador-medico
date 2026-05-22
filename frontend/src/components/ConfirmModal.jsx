export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
