import { useEffect, useRef } from 'react';
import api from '../api/client';

export function usePolling(id, onComplete, onFail, intervalMs = 3000) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    timerRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/predictions/${id}`);
        if (res.data.status === 'COMPLETED') {
          clearInterval(timerRef.current);
          onComplete(res.data);
        } else if (res.data.status === 'FAILED') {
          clearInterval(timerRef.current);
          onFail(res.data);
        }
      } catch {
        clearInterval(timerRef.current);
        onFail({ error_message: 'Erro ao verificar status da avaliação' });
      }
    }, intervalMs);

    return () => clearInterval(timerRef.current);
  }, [id]);
}
