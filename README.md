# OpenVPN Telemetry Management System

Secure web application for monitoring, managing, and auditing OpenVPN telemetry data.

## Default Credentials

| Username | Password | Role |
|----------|----------|------|
| `admin` | `password123` | Admin |

> **Security:** On first login, you will be required to change the default password before accessing the portal.

## Features

- **Dashboard** — Real-time SIEM-style overview: active sessions, VPN user stats, certificate status breakdown (Valid/Expired/Revoked), data transfer metrics (Sent/Received), and live connection feed.
- **Accounting** — Session history with per-day Sent vs Received traffic chart, Duration column, search/filter, and summary statistics.
- **Active Sessions** — Live VPN session monitor with user details, IPs, and session kill capability.
- **VPN User Management** — Manage metadata for VPN clients (Full Name, Email, Contact, Type). Color-coded status badges for account and connection states.
- **Portal User Management** — RBAC with three roles: Admin, Operator, Viewer. Forced password change on first login for all new users.
- **Audit Logs** — Comprehensive tracking of all administrative actions.
- **VPN Server Management** — Register multiple OpenVPN servers, manage API keys for telemetry ingestion.

## User Roles (RBAC)

| Role | Permissions |
|------|------------|
| **Admin** | Full access: user management, VPN server management, session kill, all views |
| **Operator** | Read access + session kill capability |
| **Viewer** | Read-only access to all monitoring pages |

## API Documentation for Telemetry Agent

The telemetry agent sends session events to the following endpoint:

### POST /api/v1/events (Telemetry Agent)

**Endpoint:** `POST /api/v1/events`
**Authentication:** `Authorization: Bearer <VPN_SERVER_API_KEY>`

The `server_id` in the body must match the `server_id` associated with the API Key.

**Supported Event Types:**
- `SESSION_CONNECTED` — VPN user connected
- `SESSION_DISCONNECTED` — VPN user disconnected
- `USERS_UPDATE` — Bulk or single certificate status sync (VALID/EXPIRED/REVOKED)
- `CCD_INFO` — Client-specific configuration (static IP, routes)

**Payload Example:**

```json
{
  "server_id": "vpn-unique-id-from-portal",
  "sent_at": "2026-02-13T12:00:00Z",
  "events": [
    {
      "event_id": "unique-uuid-v4",
      "type": "SESSION_CONNECTED",
      "common_name": "jdoe@company.com",
      "real_ip": "203.0.113.5",
      "virtual_ip": "10.8.0.2",
      "event_time_vpn": "2026-02-13T12:00:00Z"
    }
  ]
}
```

**Idempotency:** Duplicate events with the same `event_id` are ignored.

## Docker Deployment

### Prerequisites

- Docker & Docker Compose

### Step 1: Configuration

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@db:5432/telemetry
SESSION_SECRET=your_random_secret_here
TELEMETRY_API_KEY=your_secure_agent_key
```

### Step 2: Build and Start

```bash
docker-compose up -d --build
```

This launches:
1. **Web App** — Node.js/Express + React on port 5000
2. **Database** — PostgreSQL 15

## Technology Stack

- **Frontend**: React, Tailwind CSS, Shadcn UI, TanStack Query, Recharts
- **Backend**: Node.js, Express, Passport.js, Drizzle ORM
- **Database**: PostgreSQL
