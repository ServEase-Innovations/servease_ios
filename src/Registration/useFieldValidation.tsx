/* eslint-disable */
import { useState, useCallback } from 'react';
import providerInstance from '../services/providerInstance';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      let payload = {};
      
      switch (fieldType) {
        case 'email':
          // POST /api/service-providers/check-email
          endpoint = '/api/service-providers/check-email';
          payload = { email: value };
          break;
        case 'mobile':
        case 'alternate':
          // Both mobile and alternate use the same API
          // POST /api/service-providers/check-mobile
          endpoint = '/api/service-providers/check-mobile';
          payload = { mobile: value };
          break;
      }

      const response = await providerInstance.post(endpoint, payload);
      
      // Handle API response - adjust based on actual API response structure
      let isAvailable = true;
      let errorMessage = '';
      
      if (response.data.exists !== undefined) {
        isAvailable = !response.data.exists; // If exists is true, then NOT available
        errorMessage = response.data.exists 
          ? fieldType === 'email' 
            ? t('registration.basicInformation.emailTaken')
            : t('registration.basicInformation.mobileTaken')
          : '';
      } else if (response.data.available !== undefined) {
        isAvailable = response.data.available;
        errorMessage = !response.data.available 
          ? fieldType === 'email' 
            ? t('registration.basicInformation.emailTaken')
            : t('registration.basicInformation.mobileTaken')
          : '';
      } else if (response.data.isAvailable !== undefined) {
        isAvailable = response.data.isAvailable;
        errorMessage = !response.data.isAvailable 
          ? fieldType === 'email' 
            ? t('registration.basicInformation.emailTaken')
            : t('registration.basicInformation.mobileTaken')
          : '';
      } else {
        // Default assumption if API returns success without specific availability flag
        isAvailable = true;
      }
      
      setValidationResults(prev => ({
        ...prev,
        [fieldType]: { 
          loading: false, 
          error: errorMessage, 
          isAvailable 
        }
      }));

      return isAvailable;

    } catch (error: any) {
      console.error(`Error validating ${fieldType}:`, error);
      
      let errorMessage = fieldType === 'email' 
        ? t('errors.invalidEmail')
        : t('errors.invalidPhone');
      
      if (error.response?.data) {
        // Try to extract error message from API response
        const apiError = error.response.data;
        if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error.response?.status === 400) {
        errorMessage = fieldType === 'email' 
          ? t('errors.invalidEmail')
          : t('errors.invalidPhone');
      } else if (error.response?.status === 409) {
        errorMessage = fieldType === 'email' 
          ? t('registration.basicInformation.emailTaken')
          : t('registration.basicInformation.mobileTaken');
      } else if (error.response?.status === 500) {
        errorMessage = t('errors.server');
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
  }, [t]);

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