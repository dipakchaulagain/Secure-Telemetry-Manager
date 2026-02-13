import { useStats, useActiveSessions } from "@/hooks/use-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ArrowUp, ArrowDown, Server, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";

// Helper to format bytes
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Stats Card Component
function StatCard({ title, value, icon: Icon, description, trend }: any) {
  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: sessions } = useActiveSessions();

  // Mock data for the chart since we don't have historical metrics endpoint yet
  // In a real app, this would come from a /api/stats/history endpoint
  const chartData = [
    { time: '00:00', traffic: 240 },
    { time: '04:00', traffic: 139 },
    { time: '08:00', traffic: 980 },
    { time: '12:00', traffic: 3908 },
    { time: '16:00', traffic: 4800 },
    { time: '20:00', traffic: 3800 },
    { time: '23:59', traffic: 4300 },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Sessions"
          value={stats?.activeSessions || 0}
          icon={Activity}
          description="Currently connected users"
        />
        <StatCard
          title="Total Traffic"
          value={formatBytes(stats?.bytesTransferred || 0)}
          icon={ArrowUp}
          description="Total bandwidth usage"
        />
        <StatCard
          title="VPN Users"
          value={stats?.totalVpnUsers || 0}
          icon={Users}
          description="Registered client certificates"
        />
        <StatCard
          title="Server Status"
          value={stats?.serverStatus || "Unknown"}
          icon={Server}
          description="Core service health"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Network Traffic</CardTitle>
            <CardDescription>Bandwidth usage over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="time"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value} MB`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="traffic"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTraffic)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Recent Connections</CardTitle>
            <CardDescription>Latest user activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions && sessions.length > 0 ? (
                sessions.slice(0, 5).map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{session.vpnUser.commonName}</p>
                        <p className="text-xs text-muted-foreground">{session.remoteIp}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {format(new Date(session.startTime), "HH:mm")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No active sessions found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
