import { db, pool } from "./db";
import {
  users, vpnUsers, sessions, auditLogs,
  type User, type InsertUser,
  type VpnUser, type InsertVpnUser,
  type Session, type InsertSession,
  type AuditLog
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getVpnUsers(): Promise<VpnUser[]>;
  getVpnUser(id: number): Promise<VpnUser | undefined>;
  createVpnUser(user: InsertVpnUser): Promise<VpnUser>;
  updateVpnUser(id: number, user: Partial<InsertVpnUser>): Promise<VpnUser>;
  getActiveSessions(): Promise<(Session & { vpnUser: VpnUser })[]>;
  getSessionHistory(): Promise<(Session & { vpnUser: VpnUser })[]>;
  getAllSessions(): Promise<(Session & { vpnUser: VpnUser })[]>;
  createSession(session: InsertSession): Promise<Session>;
  endSession(id: number): Promise<void>;
  createAuditLog(log: { userId?: number, action: string, entityType: string, entityId?: string, details?: string }): Promise<AuditLog>;
  getAuditLogs(): Promise<(AuditLog & { user: User | null })[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getVpnUsers(): Promise<VpnUser[]> {
    return await db.select().from(vpnUsers).orderBy(desc(vpnUsers.lastConnected));
  }

  async getVpnUser(id: number): Promise<VpnUser | undefined> {
    const [user] = await db.select().from(vpnUsers).where(eq(vpnUsers.id, id));
    return user;
  }

  async createVpnUser(user: InsertVpnUser): Promise<VpnUser> {
    const [newUser] = await db.insert(vpnUsers).values(user).returning();
    return newUser;
  }

  async updateVpnUser(id: number, updates: Partial<InsertVpnUser>): Promise<VpnUser> {
    const [user] = await db.update(vpnUsers).set(updates).where(eq(vpnUsers.id, id)).returning();
    return user;
  }

  async getActiveSessions(): Promise<(Session & { vpnUser: VpnUser })[]> {
    return await db.query.sessions.findMany({
      where: eq(sessions.status, "active"),
      with: { vpnUser: true },
      orderBy: desc(sessions.startTime),
    });
  }

  async getSessionHistory(): Promise<(Session & { vpnUser: VpnUser })[]> {
    return await db.query.sessions.findMany({
      where: eq(sessions.status, "closed"),
      with: { vpnUser: true },
      orderBy: desc(sessions.endTime),
      limit: 500,
    });
  }

  async getAllSessions(): Promise<(Session & { vpnUser: VpnUser })[]> {
    return await db.query.sessions.findMany({
      with: { vpnUser: true },
      orderBy: desc(sessions.startTime),
    });
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async endSession(id: number): Promise<void> {
    await db.update(sessions)
      .set({ status: "closed", endTime: new Date() })
      .where(eq(sessions.id, id));
  }

  async createAuditLog(log: { userId?: number, action: string, entityType: string, entityId?: string, details?: string }): Promise<AuditLog> {
    const [entry] = await db.insert(auditLogs).values(log).returning();
    return entry;
  }

  async getAuditLogs(): Promise<(AuditLog & { user: User | null })[]> {
    return await db.query.auditLogs.findMany({
      with: { user: true },
      orderBy: desc(auditLogs.timestamp),
    });
  }
}

export const storage = new DatabaseStorage();
