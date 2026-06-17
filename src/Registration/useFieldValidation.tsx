/* eslint-disable */
import { useState, useCallback } from "react";
import providerInstance from "../services/providerInstance";
import utilsInstance from "../services/utilsInstance";
import { useTranslation } from "react-i18next";

interface ValidationState {
  loading: boolean;
  error: string;
  isAvailable: boolean | null;
  isValidated: boolean;
}

interface ValidationResults {
  email: ValidationState;
  mobile: ValidationState;
  alternate: ValidationState;
}

const emptyField = (): ValidationState => ({
  loading: false,
  error: "",
  isAvailable: null,
  isValidated: false,
});

export const useFieldValidation = () => {
  const { t } = useTranslation();
  const [validationResults, setValidationResults] = useState<ValidationResults>({
    email: emptyField(),
    mobile: emptyField(),
    alternate: emptyField(),
  });

  const validateField = useCallback(
    async (fieldType: "email" | "mobile" | "alternate", value: string) => {
      const trimmed = value?.trim();
      if (!trimmed) {
        setValidationResults((prev) => ({
          ...prev,
          [fieldType]: emptyField(),
        }));
        return;
      }

      setValidationResults((prev) => ({
        ...prev,
        [fieldType]: { ...emptyField(), loading: true },
      }));

      try {
        if (fieldType === "email") {
          const { data } = await utilsInstance.get(
            `/customer/check-email?email=${encodeURIComponent(trimmed.toLowerCase())}`
          );
          const taken = Boolean(data?.exists);
          setValidationResults((prev) => ({
            ...prev,
            email: {
              loading: false,
              isValidated: true,
              isAvailable: !taken,
              error: taken ? t("registration.basicInformation.emailTaken") : "",
            },
          }));
          return;
        }

        const { data } = await providerInstance.post("/api/service-providers/check-mobile", {
          mobile: trimmed.replace(/\D/g, ""),
        });
        const taken = Boolean(data?.exists ?? data?.data?.exists);

        setValidationResults((prev) => ({
          ...prev,
          [fieldType]: {
            loading: false,
            isValidated: true,
            isAvailable: !taken,
            error: taken ? t("registration.basicInformation.mobileTaken") : "",
          },
        }));
      } catch (error: unknown) {
        console.error(`Error validating ${fieldType}:`, error);
        setValidationResults((prev) => ({
          ...prev,
          [fieldType]: {
            loading: false,
            isValidated: false,
            isAvailable: null,
            error:
              t("errors.validationFailed") ||
              "Could not verify. Try again.",
          },
        }));
      }
    },
    [t]
  );

  const resetValidation = useCallback((fieldType?: "email" | "mobile" | "alternate") => {
    if (fieldType) {
      setValidationResults((prev) => ({
        ...prev,
        [fieldType]: emptyField(),
      }));
      return;
    }
    setValidationResults({
      email: emptyField(),
      mobile: emptyField(),
      alternate: emptyField(),
    });
  }, []);

  return {
    validationResults,
    validateField,
    resetValidation,
  };
};
