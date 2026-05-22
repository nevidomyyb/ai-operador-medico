import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import Pagination from '../../components/Pagination';

export default function CatalogTab({ endpoint, labelCode, labelName }) {
  const [data, setData] = useState({ items: [], total: 0 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`${endpoint}/categories`).then((res) => setCategories(res.data)).catch(() => {});
  }, [endpoint]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 15 };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get(endpoint, { params });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, search, category]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por código ou nome..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-10 text-gray-400 text-sm">Carregando...</div>
        ) : data.items.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Nenhum resultado encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-32">{labelCode}</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">{labelName}</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((item) => (
                <tr key={item.code} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-blue-700 text-xs">{item.code}</td>
                  <td className="px-4 py-2.5 text-gray-800">{item.name_ptbr}</td>
                  <td className="px-4 py-2.5 text-gray-500">{item.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
        <span>{data.total} registros</span>
        <Pagination page={page} total={data.total} perPage={15} onChange={setPage} />
      </div>
    </div>
  );
}
