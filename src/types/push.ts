/** Shared push types — keep firebase out of App.tsx import graph */
export type PushUserContext = {
  email?: string | null;
  role?: string | null;
  userId?: string | number | null;
  serviceProviderId?: string | number | null;
  customerId?: string | number | null;
};
