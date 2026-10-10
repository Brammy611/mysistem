/**
 * useSupabaseData.js
 * Generic hook untuk memuat data dari Supabase service.
 * Otomatis refresh ketika refreshTrigger berubah.
 */

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

/**
 * @param {Function} fetchFn - async function yang mengembalikan data
 * @param {Array} deps - dependensi tambahan selain refreshTrigger
 * @returns {{ data, loading, error, reload }}
 */
export function useSupabaseData(fetchFn, deps = []) {
  const { refreshTrigger } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, ...deps]);

  return { data, loading, error, reload: load };
}
