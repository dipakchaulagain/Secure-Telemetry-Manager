import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateUserRequest, type UpdateUserRequest } from "@shared/routes";
import { toast } from "@/hooks/use-toast";

// ==========================================
// SYSTEM STATS
// ==========================================
export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll every 5s
  });
}

// ==========================================
// SESSIONS
// ==========================================
export function useActiveSessions() {
  return useQuery({
    queryKey: [api.sessions.active.path],
    queryFn: async () => {
      const res = await fetch(api.sessions.active.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch active sessions");
      return api.sessions.active.responses[200].parse(await res.json());
    },
    refetchInterval: 2000, // Fast polling for live data
  });
}

export function useSessionHistory() {
  return useQuery({
    queryKey: [api.sessions.history.path],
    queryFn: async () => {
      const res = await fetch(api.sessions.history.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch session history");
      return api.sessions.history.responses[200].parse(await res.json());
    },
  });
}

export function useKillSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.sessions.kill.path, { id });
      const res = await fetch(url, { 
        method: api.sessions.kill.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to kill session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sessions.active.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Session terminated", variant: "default" });
    },
    onError: () => {
      toast({ title: "Failed to terminate session", variant: "destructive" });
    }
  });
}

// ==========================================
// VPN USERS
// ==========================================
export function useVpnUsers() {
  return useQuery({
    queryKey: [api.vpnUsers.list.path],
    queryFn: async () => {
      const res = await fetch(api.vpnUsers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch VPN users");
      return api.vpnUsers.list.responses[200].parse(await res.json());
    },
  });
}

// ==========================================
// PORTAL USERS (ADMINS)
// ==========================================
export function usePortalUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch portal users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreatePortalUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const res = await fetch(api.users.create.path, {
        method: api.users.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create user");
      return api.users.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "User created successfully" });
    },
    onError: (err) => {
      toast({ title: "Failed to create user", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdatePortalUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateUserRequest) => {
      const url = buildUrl(api.users.update.path, { id });
      const res = await fetch(url, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update user");
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "User updated successfully" });
    },
  });
}

// ==========================================
// AUDIT LOGS
// ==========================================
export function useAuditLogs() {
  return useQuery({
    queryKey: [api.audit.list.path],
    queryFn: async () => {
      const res = await fetch(api.audit.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return api.audit.list.responses[200].parse(await res.json());
    },
  });
}
