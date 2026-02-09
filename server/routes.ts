import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication first
  setupAuth(app);

  // === Portal User Management ===
  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post(api.users.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') return res.sendStatus(401);
    try {
      const input = api.users.create.input.parse(req.body);
      const user = await storage.createUser(input);
      await storage.createAuditLog({
        userId: req.user.id,
        action: "CREATE",
        entityType: "user",
        entityId: String(user.id),
        details: `Created user ${user.username} with role ${user.role}`
      });
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.patch(api.users.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const input = api.users.update.input.parse(req.body);
    const user = await storage.updateUser(id, input);
    await storage.createAuditLog({
      userId: req.user.id,
      action: "UPDATE",
      entityType: "user",
      entityId: String(user.id),
      details: `Updated user ${user.username}`
    });
    res.json(user);
  });

  // === VPN Users ===
  app.get(api.vpnUsers.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const vpnUsers = await storage.getVpnUsers();
    res.json(vpnUsers);
  });

  app.get(api.vpnUsers.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.getVpnUser(parseInt(req.params.id));
    if (!user) return res.sendStatus(404);
    res.json(user);
  });

  // === Sessions ===
  app.get(api.sessions.active.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sessions = await storage.getActiveSessions();
    res.json(sessions);
  });

  app.get(api.sessions.history.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const history = await storage.getSessionHistory();
    res.json(history);
  });

  app.post(api.sessions.kill.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role === 'viewer') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    await storage.endSession(id);
    
    await storage.createAuditLog({
      userId: req.user.id,
      action: "KILL_SESSION",
      entityType: "session",
      entityId: String(id),
      details: "Forcibly terminated active VPN session"
    });
    
    res.json({ message: "Session terminated" });
  });

  // === Stats ===
  app.get(api.stats.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const active = await storage.getActiveSessions();
    const vpnUsers = await storage.getVpnUsers();
    const totalBytes = active.reduce((acc, s) => acc + (s.bytesReceived || 0) + (s.bytesSent || 0), 0);
    
    res.json({
      activeSessions: active.length,
      totalVpnUsers: vpnUsers.length,
      bytesTransferred: totalBytes,
      serverStatus: "Online (vpn-prod-01)"
    });
  });

  // === Audit Logs ===
  app.get(api.audit.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  // Seed data check
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingUsers = await storage.getUsers();
  if (existingUsers.length === 0) {
    // Create Default Admin
    // In a real app, hash this password! The auth implementation will handle that.
    await storage.createUser({
      username: "admin",
      password: "password123", // Basic seed password
      role: "admin",
      isActive: true
    });
    
    // Create some VPN users
    const vpnUser1 = await storage.createVpnUser({ commonName: "jdoe@company.com", status: "online" });
    const vpnUser2 = await storage.createVpnUser({ commonName: "alice.smith@remote.org", status: "online" });
    const vpnUser3 = await storage.createVpnUser({ commonName: "backup-service-01", status: "offline" });
    
    // Create active sessions
    await storage.createSession({
      vpnUserId: vpnUser1.id,
      remoteIp: "203.0.113.45",
      virtualIp: "10.8.0.5",
      bytesReceived: 1048576,
      bytesSent: 524288,
      status: "active"
    });
    
    await storage.createSession({
      vpnUserId: vpnUser2.id,
      remoteIp: "198.51.100.22",
      virtualIp: "10.8.0.6",
      bytesReceived: 256000,
      bytesSent: 128000,
      status: "active"
    });

    console.log("Database seeded with initial data");
  }
}
