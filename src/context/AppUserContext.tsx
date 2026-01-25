// AppUserContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

// interface AppUser {
//   email: string;
//   email_verified?: boolean;
//   name?: string;
//   nickname?: string;
//   picture?: string;
//   sub: string;
//   updated_at?: string;
//   role?: string;
//   serviceProviderId?: string;
//   // add more fields if needed
// }

interface AppUserContextType {
  appUser: any | null;
  setAppUser: React.Dispatch<React.SetStateAction<any | null>>;
}

const AppUserContext = createContext<AppUserContextType | undefined>(undefined);

interface AppUserProviderProps {
  children: ReactNode;
}

export const AppUserProvider: React.FC<AppUserProviderProps> = ({ children }) => {
  const [appUser, setAppUser] = useState<any | null>(null);

  return (
    <AppUserContext.Provider value={{ appUser, setAppUser }}>
      {children}
    </AppUserContext.Provider>
  );
};

export const useAppUser = (): AppUserContextType => {
  const context = useContext(AppUserContext);
  if (!context) {
    throw new Error("useAppUser must be used within an AppUserProvider");
  }
  return context;
};