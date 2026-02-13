# OpenVPN Telemetry Management System

Robust web application for monitoring and managing OpenVPN telemetry data.

## Features

- **Dashboard**: Real-time visualization of VPN server health, active sessions, and data throughput.
- **Accounting**: Detailed session history for SOC and Audit teams with CSV export.
- **VPN User Management**: Manage metadata for VPN clients (Full Name, Contact, Type).
- **Portal User Management**: RBAC (Admin, Operator, Viewer) with secure authentication.
- **Audit Logs**: Comprehensive tracking of all administrative actions.

## API Documentation for Telemetry Agent

The telemetry agent should send session events to the following endpoint:

### POST /api/v1/events (Telemetry Agent)

The agent sends batched events (connect/disconnect) in a JSON payload.

**Endpoint:** `POST /api/v1/events`
**Authentication:**
- Header: `Authorization: Bearer <VPN_SERVER_API_KEY>`
- The `server_id` in the body must match the `server_id` associated with the API Key.

**Payload Structure:**

```json
{
  "server_id": "vpn-unique-id-from-portal",
  "sent_at": "2026-02-13T12:00:00Z",
  "events": [
    {
      "event_id": "unique-uuid-v4",
      "seq": 1,
      "type": "SESSION_CONNECTED",
      "common_name": "jdoe@company.com",
      "real_ip": "203.0.113.5",
      "real_port": "1194",
      "virtual_ip": "10.8.0.2",
      "event_time_vpn": "2026-02-13T12:00:00Z"
    },
    {
      "event_id": "unique-uuid-v4-2",
      "seq": 2,
      "type": "SESSION_DISCONNECTED",
      "common_name": "jdoe@company.com",
      "event_time_vpn": "2026-02-13T12:30:00Z"
    }
  ]
}
```

**Note:** The system enforces idempotency using `event_id`. Duplicate events with the same `event_id` will be ignored.

## Docker Deployment

### Prerequisites

- Docker
- Docker Compose

### Step 1: Configuration

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=postgresql://user:password@db:5432/telemetry
SESSION_SECRET=your_random_secret_here
TELEMETRY_API_KEY=your_secure_agent_key
```

### Step 2: Build and Start

```bash
docker-compose up -d --build
```

This will launch:
1. **Web App**: Node.js/Express + React (Vite) on port 5000.
2. **Database**: PostgreSQL 15.

## Technology Stack

- **Frontend**: React, Tailwind CSS, Shadcn UI, TanStack Query.
- **Backend**: Node.js, Express, Passport.js.
- **Database**: PostgreSQL with Drizzle ORM.
- **Visualization**: Recharts.
