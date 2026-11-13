import { useState, useCallback } from 'react';

export function useAlert() {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ message, type, id: Date.now() });
  }, []);

  const clearAlert = useCallback(() => setAlert(null), []);

  return { alert, showAlert, clearAlert };
}

