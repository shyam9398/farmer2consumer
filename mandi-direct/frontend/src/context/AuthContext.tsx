import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { apiClient } from "@/lib/axios";
import { UserProfile, UserRole, RegisterPayload, LoginPayload } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<UserProfile | null>;
  register: (payload: RegisterPayload) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  loginDemoUser: (role: UserRole) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch backend verified profile
  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const response = await apiClient.get<UserProfile>("/api/v1/auth/me");
      setProfile(response.data);
      return response.data;
    } catch (err: any) {
      // If profile doesn't exist yet on the backend
      console.warn("Could not fetch user profile:", err?.response?.data?.detail || err.message);
      return null;
    }
  }, []);

  // Listen to Supabase auth state changes
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          // Check local storage for mock demo user if any
          const savedDemoProfile = localStorage.getItem("mandi_demo_profile");
          if (savedDemoProfile) {
            const parsed = JSON.parse(savedDemoProfile);
            setProfile(parsed);
          }
          setIsLoading(false);
          return;
        }

        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession) {
            await fetchProfile();
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession) {
        await fetchProfile();
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Login via Username & Password
  const login = async ({ username, password }: LoginPayload): Promise<UserProfile | null> => {
    setIsLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@mandidirect.in`;

      // 1. First try direct backend login endpoint
      try {
        const response = await apiClient.post<{ access_token: string; profile: UserProfile }>("/api/v1/auth/login", {
          username: cleanUsername,
          password,
        });
        if (response.data?.access_token && response.data?.profile) {
          localStorage.setItem("mandi_demo_token", response.data.access_token);
          localStorage.setItem("mandi_demo_profile", JSON.stringify(response.data.profile));
          setProfile(response.data.profile);
          return response.data.profile;
        }
      } catch (backendErr: any) {
        if (backendErr?.response?.status === 401 || backendErr?.response?.status === 403) {
          throw new Error(backendErr?.response?.data?.detail || "Invalid username or password.");
        }
      }

      // 2. If Supabase is configured, try Supabase Auth
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (!error && data?.user) {
            setSession(data.session);
            setUser(data.user);
            const userProfile = await fetchProfile();
            return userProfile;
          }
        } catch (supaErr) {
          console.warn("Supabase signInWithPassword fallback:", supaErr);
        }
      }

      // 3. Fallback for registered users saved locally
      const localUsersRaw = localStorage.getItem("mandi_registered_users");
      if (localUsersRaw) {
        try {
          const localUsers = JSON.parse(localUsersRaw);
          if (localUsers[cleanUsername]) {
            const userEntry = localUsers[cleanUsername];
            if (userEntry.password === password) {
              localStorage.setItem("mandi_demo_profile", JSON.stringify(userEntry.profile));
              setProfile(userEntry.profile);
              return userEntry.profile;
            } else {
              throw new Error("Invalid username or password.");
            }
          }
        } catch (parseErr: any) {
          if (parseErr?.message === "Invalid username or password.") throw parseErr;
        }
      }

      // 4. Quick match for standard demo usernames: farmer, buyer, admin, logistic, small consumers
      if (cleanUsername === "farmer") return await loginDemoUser("FARMER");
      if (cleanUsername === "buyer") return await loginDemoUser("BUYER");
      if (cleanUsername === "admin") return await loginDemoUser("ADMIN");
      if (cleanUsername === "logistic" || cleanUsername === "logistics") return await loginDemoUser("LOGISTICS");
      if (
        cleanUsername === "consumer" ||
        cleanUsername === "consumers" ||
        cleanUsername === "small consumer" ||
        cleanUsername === "small consumers" ||
        cleanUsername === "small_consumer" ||
        cleanUsername === "small_consumers"
      ) {
        return await loginDemoUser("CONSUMER");
      }

      const upperRole = cleanUsername.toUpperCase() as UserRole;
      const validRoles: UserRole[] = ["FARMER", "BUYER", "ADMIN", "LOGISTICS", "CONSUMER"];
      if (validRoles.includes(upperRole)) {
        return await loginDemoUser(upperRole);
      }

      throw new Error("Invalid credentials. Please verify your username and password.");
    } finally {
      setIsLoading(false);
    }
  };

  // Register via Username & Password
  const register = async ({ username, password, fullName, phone, role }: RegisterPayload): Promise<UserProfile | null> => {
    setIsLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const email = `${cleanUsername}@mandidirect.in`;

      // 1. First try backend register endpoint
      try {
        const response = await apiClient.post<{ access_token: string; profile: UserProfile }>("/api/v1/auth/register", {
          username: cleanUsername,
          password,
          full_name: fullName,
          phone,
          role,
        });
        if (response.data?.access_token && response.data?.profile) {
          localStorage.setItem("mandi_demo_token", response.data.access_token);
          localStorage.setItem("mandi_demo_profile", JSON.stringify(response.data.profile));
          setProfile(response.data.profile);
          return response.data.profile;
        }
      } catch (backendErr: any) {
        if (backendErr?.response?.data?.detail) {
          throw new Error(backendErr.response.data.detail);
        }
      }

      // 2. Try Supabase Auth if configured
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                username: cleanUsername,
                phone,
                role,
              },
            },
          });

          if (!error && data?.user) {
            setSession(data.session);
            setUser(data.user);

            // Synchronize profile to FastAPI PostgreSQL backend
            try {
              const profileRes = await apiClient.post<UserProfile>("/api/v1/auth/profile", {
                full_name: fullName,
                phone,
                role,
              });
              setProfile(profileRes.data);
              return profileRes.data;
            } catch {
              // fallback to default
            }
          }
        } catch (supaErr) {
          console.warn("Supabase signUp error:", supaErr);
        }
      }

      // 3. Fallback: create and store profile locally
      const fallbackProfile: UserProfile = {
        id: `user-${Date.now()}`,
        auth_user_id: `auth-${cleanUsername}-uuid`,
        full_name: fullName,
        phone: phone || null,
        email,
        role,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save into registered users
      const localUsersRaw = localStorage.getItem("mandi_registered_users");
      const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : {};
      localUsers[cleanUsername] = { password, profile: fallbackProfile };
      localStorage.setItem("mandi_registered_users", JSON.stringify(localUsers));

      localStorage.setItem("mandi_demo_profile", JSON.stringify(fallbackProfile));
      setProfile(fallbackProfile);
      return fallbackProfile;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem("mandi_demo_profile");
      localStorage.removeItem("mandi_demo_token");
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo user helper to test all 5 roles interactively without requiring live Supabase credentials
  const loginDemoUser = async (role: UserRole): Promise<UserProfile> => {
    try {
      const response = await apiClient.post<{ access_token: string; profile: UserProfile }>("/api/v1/auth/demo-login", { role });
      localStorage.setItem("mandi_demo_token", response.data.access_token);
      localStorage.setItem("mandi_demo_profile", JSON.stringify(response.data.profile));
      setProfile(response.data.profile);
      return response.data.profile;
    } catch (err) {
      console.warn("Backend demo-login failed, using local profile fallback:", err);
      const demoProfile: UserProfile = {
        id: `demo-${role.toLowerCase()}-uuid`,
        auth_user_id: `auth-${role.toLowerCase()}-uuid`,
        full_name: `Demo ${role.charAt(0) + role.slice(1).toLowerCase()} User`,
        phone: "+919876543210",
        email: `${role.toLowerCase()}@mandidirect.in`,
        role: role,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      localStorage.setItem("mandi_demo_profile", JSON.stringify(demoProfile));
      setProfile(demoProfile);
      return demoProfile;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        login,
        register,
        logout,
        refreshProfile: fetchProfile,
        loginDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
