// AppUserContext.tsx - Updated with AsyncStorage persistence
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppUserContextType {
  appUser: any | null;
  setAppUser: React.Dispatch<React.SetStateAction<any | null>>;
  clearAppUser: () => void;
  isLoading: boolean;
}

const AppUserContext = createContext<AppUserContextType | undefined>(undefined);

interface AppUserProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = '@app_user_data';

export const AppUserProvider: React.FC<AppUserProviderProps> = ({ children }) => {
  const [appUser, setAppUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved user data on startup
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log("📀 Loaded saved user data:", userData);
          setAppUser(userData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Save user data whenever it changes
  const setAppUserAndSave = useCallback(async (user: any | null) => {
    setAppUser(user);
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        console.log("💾 Saved user data to storage");
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log("🗑️ Removed user data from storage");
      }
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  }, []);

  const clearAppUser = useCallback(async () => {
    console.log("🧹 Clearing AppUser context");
    setAppUser(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("🗑️ Cleared user data from storage");
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  }, []);

  return (
    <AppUserContext.Provider value={{ 
      appUser, 
      setAppUser: setAppUserAndSave,
      clearAppUser,
      isLoading
    }}>
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