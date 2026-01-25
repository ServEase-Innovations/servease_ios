import { useState, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';

interface ValidationState {
  loading: boolean;
  error: string;
  isAvailable: boolean | null;
}

interface ValidationResults {
  email: ValidationState;
  mobile: ValidationState;
  alternate: ValidationState;
}

export const useFieldValidation = () => {
  const [validationResults, setValidationResults] = useState<ValidationResults>({
    email: { loading: false, error: '', isAvailable: null },
    mobile: { loading: false, error: '', isAvailable: null },
    alternate: { loading: false, error: '', isAvailable: null },
  });

  const validateField = useCallback(async (fieldType: 'email' | 'mobile' | 'alternate', value: string) => {
    if (!value.trim()) {
      setValidationResults(prev => ({
        ...prev,
        [fieldType]: { loading: false, error: '', isAvailable: null }
      }));
      return;
    }

    setValidationResults(prev => ({
      ...prev,
      [fieldType]: { loading: true, error: '', isAvailable: null }
    }));

    try {
      let endpoint = '';
      
      switch (fieldType) {
        case 'email':
          endpoint = `/api/serviceproviders/check-email/${encodeURIComponent(value)}`;
          break;
        case 'mobile':
          endpoint = `/api/serviceproviders/check-mobile/${encodeURIComponent(value)}`;
          break;
        case 'alternate':
          endpoint = `/api/serviceproviders/check-alternate/${encodeURIComponent(value)}`;
          break;
      }

      const response = await axiosInstance.get(endpoint);
      
      const isAvailable = response.data.available !== false;
      
      setValidationResults(prev => ({
        ...prev,
        [fieldType]: { 
          loading: false, 
          error: isAvailable ? '' : `${fieldType} is already registered`, 
          isAvailable 
        }
      }));

      return isAvailable;

    } catch (error: any) {
      console.error(`Error validating ${fieldType}:`, error);
      
      let errorMessage = `Error checking ${fieldType}`;
      if (error.response?.status === 409) {
        errorMessage = `${fieldType} is already registered`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setValidationResults(prev => ({
        ...prev,
        [fieldType]: { 
          loading: false, 
          error: errorMessage, 
          isAvailable: false 
        }
      }));

      return false;
    }
  }, []);

  const resetValidation = useCallback((fieldType?: 'email' | 'mobile' | 'alternate') => {
    if (fieldType) {
      setValidationResults(prev => ({
        ...prev,
        [fieldType]: { loading: false, error: '', isAvailable: null }
      }));
    } else {
      setValidationResults({
        email: { loading: false, error: '', isAvailable: null },
        mobile: { loading: false, error: '', isAvailable: null },
        alternate: { loading: false, error: '', isAvailable: null },
      });
    }
  }, []);

  return {
    validationResults,
    validateField,
    resetValidation
  };
};