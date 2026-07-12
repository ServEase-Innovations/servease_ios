// AppUserContext.tsx - Updated with AsyncStorage persistence
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  SetStateAction,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const STORAGE_KEY = "@app_user_data";
const TOKEN_KEY = "token";
const ROLE_KEY = "userRole";

async function persistAppUser(user: unknown): Promise<void> {
  if (user == null) {
    await AsyncStorage.multiRemove([STORAGE_KEY, TOKEN_KEY, ROLE_KEY]);
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  const record = user as Record<string, unknown>;
  const token = record.token ?? record.accessToken;
  if (token && String(token).trim()) {
    await AsyncStorage.setItem(TOKEN_KEY, String(token));
  }
  if (record.role) {
    await AsyncStorage.setItem(ROLE_KEY, String(record.role));
  }
}

export const AppUserProvider: React.FC<AppUserProviderProps> = ({ children }) => {
  const [appUser, setAppUserState] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const pairs = await AsyncStorage.multiGet([STORAGE_KEY, TOKEN_KEY, ROLE_KEY]);
        const savedUser = pairs[0][1];
        const storedToken = pairs[1][1];
        const storedRole = pairs[2][1];

        if (savedUser) {
          const userData = JSON.parse(savedUser) as Record<string, unknown>;
          if (storedToken && !userData.token && !userData.accessToken) {
            userData.token = storedToken;
            userData.accessToken = storedToken;
          }
          if (storedRole && !userData.role) {
            userData.role = storedRole;
          }
          console.log("📀 Loaded saved user data:", userData);
          setAppUserState(userData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadUserData();
  }, []);

  const setAppUser = useCallback((value: SetStateAction<any | null>) => {
    setAppUserState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;

      void persistAppUser(next).catch((error) => {
        console.error("Error saving user data:", error);
      });

      if (next != null) {
        console.log("💾 Saved user data to storage");
      } else {
        console.log("🗑️ Removed user data from storage");
      }

      return next ?? null;
    });
  }, []);

  const clearAppUser = useCallback(async () => {
    console.log("🧹 Clearing AppUser context");
    setAppUserState(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("🗑️ Cleared user data from storage");
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  }, []);

  return (
    <AppUserContext.Provider
      value={{
        appUser,
        setAppUser,
        clearAppUser,
        isLoading,
      }}
    >
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
