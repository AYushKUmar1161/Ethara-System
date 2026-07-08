import { create } from "zustand";

interface UserProfile {
  id: number;
  username: str;
  email: str;
  role: {
    id: number;
    name: str;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (accessToken: string, refreshToken: string, userProfile: UserProfile) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  login: (accessToken, refreshToken, userProfile) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user_profile", JSON.stringify(userProfile));
    set({ isAuthenticated: true, user: userProfile });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_profile");
    set({ isAuthenticated: false, user: null });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  initialize: () => {
    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("access_token");
      const userProfileStr = localStorage.getItem("user_profile");
      if (accessToken && userProfileStr) {
        try {
          const user = JSON.parse(userProfileStr);
          set({ isAuthenticated: true, user });
        } catch {
          set({ isAuthenticated: false, user: null });
        }
      }
    }
  },
}));
