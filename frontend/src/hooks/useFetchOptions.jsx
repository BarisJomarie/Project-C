import { useEffect, useState } from 'react';
import axios from 'axios';

export default function useFetchOptions(searchTerm, column, API_URL, token) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (typeof searchTerm === 'string' && searchTerm.trim() !== '') {
        setLoading(true);
        axios.get(`${API_URL}/api/users/publication/indexes`, {
          params: { query: searchTerm, column },
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setOptions(res.data))
        .catch(err => {
          if (err.response?.status === 404) console.log(err.response.data.message);
          else if (err.response?.status === 500) console.error(err.response.data.message);
          else console.error("Unexpected error: ", err);
        })
        .finally(() => setLoading(false));
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, column, API_URL, token]);

  return { options, loading };
}
