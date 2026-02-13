import { useStats, useActiveSessions, useVpnUsers } from "@/hooks/use-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Server, Activity, Shield, ShieldAlert, ShieldX, Wifi } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format } from "date-fns";

// SIEM-style Stats Card
function StatCard({ title, value, icon: Icon, description, accent = "primary" }: any) {
  const accentColors: Record<string, string> = {
    primary: "bg-blue-500/10 text-blue-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    cyan: "bg-cyan-500/10 text-cyan-500",
    red: "bg-red-500/10 text-red-500",
    violet: "bg-violet-500/10 text-violet-500",
  };

  return (
    <Card className="overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accentColors[accent] || accentColors.primary}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: sessions } = useActiveSessions();
  const { data: vpnUsers } = useVpnUsers();

  // Build traffic chart from real session data
  const sessionChartData = sessions?.reduce((acc: Record<string, { time: string; sessions: number }>, s: any) => {
    const hour = format(new Date(s.startTime), "HH:00");
    if (!acc[hour]) {
      acc[hour] = { time: hour, sessions: 0 };
    }
    acc[hour].sessions += 1;
    return acc;
  }, {}) ?? {};

  const chartSeries = Object.values(sessionChartData).sort(
    (a, b) => a.time.localeCompare(b.time)
  );

  // VPN User status breakdown for bar chart
  const statusData = stats?.vpnUsersByStatus ? [
    { name: "Valid", count: stats.vpnUsersByStatus.valid, color: "#10b981" },
    { name: "Expired", count: stats.vpnUsersByStatus.expired, color: "#f59e0b" },
    { name: "Revoked", count: stats.vpnUsersByStatus.revoked, color: "#ef4444" },
  ] : [];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[350px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Active Sessions"
          value={stats?.activeSessions || 0}
          icon={Activity}
          description="Live VPN connections"
          accent="emerald"
        />
        <StatCard
          title="VPN Users"
          value={stats?.totalVpnUsers || 0}
          icon={Users}
          description="Registered certificates"
          accent="primary"
        />
      </div>

      {/* Secondary Stats Row — Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Valid Certificates"
          value={stats?.vpnUsersByStatus?.valid || 0}
          icon={Shield}
          accent="emerald"
        />
        <StatCard
          title="Expired Certificates"
          value={stats?.vpnUsersByStatus?.expired || 0}
          icon={ShieldAlert}
          accent="amber"
        />
        <StatCard
          title="Revoked Certificates"
          value={stats?.vpnUsersByStatus?.revoked || 0}
          icon={ShieldX}
          accent="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sessions Chart */}
        <Card className="lg:col-span-2 border-border/40 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Active Sessions Timeline</CardTitle>
            <CardDescription className="text-xs">Session distribution by start hour</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No active session data to display
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSeries}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSessions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Certificate Status Breakdown */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Certificate Status</CardTitle>
            <CardDescription className="text-xs">VPN user certificate breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {statusData.every(d => d.count === 0) ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No VPN users registered yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical" barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" width={70} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Connections Feed */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Live Connections</CardTitle>
              <CardDescription className="text-xs">Currently connected VPN users</CardDescription>
            </div>
            {sessions && sessions.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {sessions.length} active
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions && sessions.length > 0 ? (
              sessions.slice(0, 8).map((session: any) => (
                <div key={session.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{session.vpnUser?.commonName || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground font-mono">{session.remoteIp} → {session.virtualIp || "N/A"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-muted-foreground">
                      {format(new Date(session.startTime), "MMM d, HH:mm")}
                    </p>
                    {session.serverId && (
                      <p className="text-[10px] text-muted-foreground/60 font-mono">{session.serverId}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Activity className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No active sessions
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
