import type { Express } from "express";
import { type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

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
        details: `Created user ${user.username}`
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

  app.patch("/api/vpn-users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role === 'viewer') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const user = await storage.updateVpnUser(id, req.body);
    await storage.createAuditLog({
      userId: req.user.id,
      action: "UPDATE_VPN_USER",
      entityType: "vpn_user",
      entityId: String(id),
      details: `Updated VPN user info for ${user.commonName}`
    });
    res.json(user);
  });

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

  app.get("/api/accounting", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sessions = await storage.getAllSessions();
    res.json(sessions);
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
      details: "Terminated active VPN session"
    });
    res.json({ message: "Session terminated" });
  });

  app.get(api.stats.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const active = await storage.getActiveSessions();
    const vpnUsers = await storage.getVpnUsers();
    const totalBytes = active.reduce((acc, s) => acc + (s.bytesReceived || 0) + (s.bytesSent || 0), 0);
    res.json({
      activeSessions: active.length,
      totalVpnUsers: vpnUsers.length,
      bytesTransferred: totalBytes,
      serverStatus: "Online"
    });
  });

  app.get(api.audit.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingUsers = await storage.getUsers();
  if (existingUsers.length === 0) {
    await storage.createUser({
      username: "admin",
      password: "password123",
      role: "admin",
      isActive: true,
      email: "admin@example.com",
      fullName: "System Admin"
    });
    
    const v1 = await storage.createVpnUser({ commonName: "jdoe@company.com", type: "Employee", fullName: "John Doe", email: "jdoe@company.com" });
    const v2 = await storage.createVpnUser({ commonName: "vendor-x", type: "Vendor", fullName: "External Vendor" });

    await storage.createSession({ vpnUserId: v1.id, remoteIp: "1.1.1.1", virtualIp: "10.8.0.2", status: "active" });
    await storage.createSession({ vpnUserId: v2.id, remoteIp: "2.2.2.2", virtualIp: "10.8.0.3", status: "closed", endTime: new Date() });
  }
}
