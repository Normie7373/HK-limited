import { useState, useCallback } from 'react';

export function useApi(apiFunc) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc(...args);
      // Backend success responses: { success: true, data: ... }
      const responseData = response.data.success ? response.data.data : response.data;
      setData(responseData);
      return responseData;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'An error occurred';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { data, loading, error, execute, setData };
}
export default useApi;
