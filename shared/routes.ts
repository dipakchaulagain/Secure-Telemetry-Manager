import { z } from 'zod';
import {
  insertUserSchema,
  insertVpnUserSchema,
  insertVpnServerSchema,
  users,
  vpnUsers,
  vpnServers,
  sessions,
  auditLogs,
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  // Auth Routes
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(), // Returns user object (without password ideally, handled in implementation)
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },

  // Portal User Management
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id' as const,
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // VPN User Monitoring
  vpnUsers: {
    list: {
      method: 'GET' as const,
      path: '/api/vpn-users' as const,
      responses: {
        200: z.array(z.custom<typeof vpnUsers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/vpn-users/:id' as const,
      responses: {
        200: z.custom<typeof vpnUsers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/vpn-users/:id' as const,
      // Common name is immutable; other fields can be updated
      input: insertVpnUserSchema
        .omit({ commonName: true })
        .partial(),
      responses: {
        200: z.custom<typeof vpnUsers.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
  },

  // Session Monitoring
  sessions: {
    active: {
      method: 'GET' as const,
      path: '/api/sessions/active' as const,
      responses: {
        200: z.array(z.custom<typeof sessions.$inferSelect & { vpnUser: typeof vpnUsers.$inferSelect }>()),
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/sessions/history' as const,
      responses: {
        200: z.array(z.custom<typeof sessions.$inferSelect & { vpnUser: typeof vpnUsers.$inferSelect }>()),
      },
    },
    kill: {
      method: 'POST' as const,
      path: '/api/sessions/:id/kill' as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },

  // System Stats for Dashboard
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats' as const,
      responses: {
        200: z.object({
          activeSessions: z.number(),
          totalVpnUsers: z.number(),
          bytesTransferred: z.number(),
          serverStatus: z.string(),
        }),
      },
    },
  },

  // Audit Logs
  audit: {
    list: {
      method: 'GET' as const,
      path: '/api/audit-logs' as const,
      responses: {
        200: z.array(z.custom<typeof auditLogs.$inferSelect & { user: typeof users.$inferSelect | null }>()),
      },
    },
  },

  // VPN Server Management
  vpnServers: {
    list: {
      method: 'GET' as const,
      path: '/api/vpn-servers' as const,
      responses: {
        200: z.array(z.custom<typeof vpnServers.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vpn-servers' as const,
      input: insertVpnServerSchema,
      responses: {
        201: z.custom<typeof vpnServers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/vpn-servers/:id' as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    regenerateKey: {
      method: 'POST' as const,
      path: '/api/vpn-servers/:id/regenerate-key' as const,
      responses: {
        200: z.custom<typeof vpnServers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Telemetry ingestion (OpenVPN agent)
  telemetry: {
    ingest: {
      method: 'POST' as const,
      path: '/api/v1/events' as const,
      input: z.object({
        server_id: z.string(),
        sent_at: z.string(), // ISO timestamp from agent
        events: z.array(
          z.object({
            event_id: z.string(),
            seq: z.number(),
            type: z.enum(['SESSION_CONNECTED', 'SESSION_DISCONNECTED']),
            common_name: z.string(),
            real_ip: z.string().nullable().optional(),
            real_port: z.string().nullable().optional(),
            virtual_ip: z.string().nullable().optional(),
            event_time_vpn: z.string(), // ISO timestamp from VPN host
          }),
        ),
      }),
      responses: {
        202: z.object({ received: z.number() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

// Helper types for frontend
export type CreateUserRequest = z.infer<typeof insertUserSchema>;
export type UpdateUserRequest = Partial<CreateUserRequest>;
export type CreateVpnServerRequest = z.infer<typeof insertVpnServerSchema>;

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
