import { useEffect, useState } from 'react';
import axios from 'axios';

export default function useMultiFetchOptions(searchTerms, column, API_URL, token) {
  const [optionsByIndex, setOptionsByIndex] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (typeof searchTerms === 'object') {
        Object.entries(searchTerms).forEach(([index, term]) => {
          if ((term || '').trim() !== '') {
            setLoading(true);
            axios.get(`${API_URL}/api/users/publication/indexes`, {
              params: { query: term, column },
              headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
              setOptionsByIndex(prev => ({ ...prev, [index]: res.data }));
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
          }
        });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerms, column, API_URL, token]);

  return { optionsByIndex, loading };
}
