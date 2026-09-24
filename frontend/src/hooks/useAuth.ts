import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, setToken, clearToken } from '../lib/api';

export interface UserProfile {
  id: number; username: string; email: string; displayName: string | null;
  level: number; currentXp: number; xpToNextLevel: number; totalXp: number;
  avatarClass: string; theme: string; createdAt: string;
}

async function fetchMe(): Promise<UserProfile | null> {
  try { return await api.get<UserProfile>('/auth/me'); } catch { return null; }
}

export function useAuth() {
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 30_000,
  });

  const loginMutation = useMutation({
    mutationFn: (creds: { email: string; password: string }) =>
      api.post<{ token: string; user: UserProfile }>('/auth/login', creds),
    onSuccess: (data) => { setToken(data.token); qc.setQueryData(['me'], data.user); },
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => api.post<{ token: string; user: UserProfile }>('/auth/register', data),
    onSuccess: (data) => { setToken(data.token); qc.setQueryData(['me'], data.user); },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => { clearToken(); },
    onSuccess: () => { qc.setQueryData(['me'], null); qc.clear(); },
  });

  const setTheme = async (theme: string) => {
    await api.put('/auth/theme', { theme });
    qc.setQueryData(['me'], (old: any) => old ? { ...old, theme } : old);
  };

  return {
    user: user ?? null,
    isLoading,
    isLoggedIn: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    setTheme,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
  };
}
