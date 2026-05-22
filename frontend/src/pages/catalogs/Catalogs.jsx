import { useState } from 'react';
import CatalogTab from './CatalogTab';

const TABS = [
  { label: 'Diagnósticos (ICD-10)', endpoint: '/catalogs/diagnoses', code: 'Código ICD-10', name: 'Descrição PT-BR' },
  { label: 'Procedimentos (TUSS)',  endpoint: '/catalogs/procedures', code: 'Código TUSS',   name: 'Descrição PT-BR' },
];

export default function Catalogs() {
  const [tab, setTab] = useState(0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Catálogos</h1>
      <p className="text-gray-500 text-sm mb-6">Consulte diagnósticos e procedimentos disponíveis</p>

      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(({ label }, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <CatalogTab
        key={tab}
        endpoint={TABS[tab].endpoint}
        labelCode={TABS[tab].code}
        labelName={TABS[tab].name}
      />
    </div>
  );
}
