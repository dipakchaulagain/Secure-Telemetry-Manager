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

### POST /api/v1/events (Telemetry Agent Only)

The agent should POST JSON data when a user connects, disconnects, or periodically for status updates.

**Authentication:** API Key (Managed via environment variables)

**Payload Structure:**

```json
{
  "event": "connect" | "disconnect" | "update",
  "common_name": "user@domain.com",
  "remote_ip": "1.2.3.4",
  "virtual_ip": "10.8.0.5",
  "bytes_received": 1048576,
  "bytes_sent": 524288,
  "timestamp": "2026-02-09T12:00:00Z"
}
```

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
