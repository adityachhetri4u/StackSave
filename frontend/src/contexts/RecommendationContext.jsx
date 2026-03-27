import { createContext, useContext, useState } from 'react';
import api from '../lib/api';

const RecommendationContext = createContext({});

export function RecommendationProvider({ children }) {
  const [merchant, setMerchant] = useState(null);
  const [cartValue, setCartValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getRecommendation = async (merchantId, value) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await api.post('/recommendation', {
        merchant_id: merchantId,
        cart_value: parseFloat(value),
      });
      setResult(response.data);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to get recommendation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return (
    <RecommendationContext.Provider
      value={{
        merchant,
        setMerchant,
        cartValue,
        setCartValue,
        result,
        loading,
        error,
        getRecommendation,
        clearResult,
      }}
    >
      {children}
    </RecommendationContext.Provider>
  );
}

export const useRecommendation = () => {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error('useRecommendation must be used within a RecommendationProvider');
  }
  return context;
};
