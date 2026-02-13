import { useState, useMemo } from "react";
import { useSessionHistory } from "@/hooks/use-data";
import { format, differenceInMinutes, differenceInHours } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowUpDown, ArrowDown, ArrowUp, Clock, Search } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDuration(startTime: string, endTime: string | null) {
  if (!endTime) return "—";
  const start = new Date(startTime);
  const end = new Date(endTime);
  const totalMinutes = differenceInMinutes(end, start);
  if (totalMinutes < 1) return "< 1m";
  const hours = differenceInHours(end, start);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function AccountingPage() {
  const { data: sessions, isLoading } = useSessionHistory();
  const [searchTerm, setSearchTerm] = useState("");

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    if (!searchTerm.trim()) return sessions;
    const term = searchTerm.toLowerCase();
    return sessions.filter((s: any) =>
      s.vpnUser?.commonName?.toLowerCase().includes(term) ||
      s.remoteIp?.toLowerCase().includes(term)
    );
  }, [sessions, searchTerm]);

  // Summary stats
  const totalSessions = sessions?.length || 0;
  const totalBytesIn = sessions?.reduce((acc: number, s: any) => acc + (s.bytesReceived || 0), 0) || 0;
  const totalBytesOut = sessions?.reduce((acc: number, s: any) => acc + (s.bytesSent || 0), 0) || 0;
  const avgDurationMinutes = useMemo(() => {
    if (!sessions || sessions.length === 0) return 0;
    const withEnd = sessions.filter((s: any) => s.endTime);
    if (withEnd.length === 0) return 0;
    const totalMin = withEnd.reduce((acc: number, s: any) => {
      return acc + differenceInMinutes(new Date(s.endTime), new Date(s.startTime));
    }, 0);
    return Math.round(totalMin / withEnd.length);
  }, [sessions]);

  // Chart data: daily sent vs received
  const chartData = useMemo(() => {
    if (!sessions) return [];
    const daily: Record<string, { date: string; sent: number; received: number }> = {};
    sessions.forEach((s: any) => {
      const day = format(new Date(s.startTime), "yyyy-MM-dd");
      if (!daily[day]) {
        daily[day] = { date: day, sent: 0, received: 0 };
      }
      daily[day].sent += s.bytesSent || 0;
      daily[day].received += s.bytesReceived || 0;
    });
    return Object.values(daily).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Sessions</p>
                <p className="text-2xl font-bold tracking-tight">{totalSessions}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <ArrowUpDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Bytes In</p>
                <p className="text-2xl font-bold tracking-tight">{formatBytes(totalBytesIn)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                <ArrowDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Bytes Out</p>
                <p className="text-2xl font-bold tracking-tight">{formatBytes(totalBytesOut)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                <ArrowUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Duration</p>
                <p className="text-2xl font-bold tracking-tight">{avgDurationMinutes > 60 ? `${Math.floor(avgDurationMinutes / 60)}h ${avgDurationMinutes % 60}m` : `${avgDurationMinutes}m`}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Traffic Over Time</CardTitle>
          <CardDescription className="text-xs">
            Sent vs received data per day based on session history
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No historical data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="acctSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="acctReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => format(new Date(v), "MMM d")}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatBytes(value as number)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name: string) => [
                    formatBytes(value as number),
                    name === "sent" ? "Sent" : "Received"
                  ]}
                  labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#acctSent)"
                  name="sent"
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#acctReceived)"
                  name="received"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Session Table */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Session History</CardTitle>
              <CardDescription className="text-xs">
                Per-session connection records for audit and compliance
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm bg-background/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">User</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Started</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Ended</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Duration</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Bytes In</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Bytes Out</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading session data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {searchTerm ? "No sessions match your search." : "No session records found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session: any) => {
                    const inBytes = session.bytesReceived || 0;
                    const outBytes = session.bytesSent || 0;
                    const total = inBytes + outBytes;

                    return (
                      <TableRow key={session.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-sm">
                          {session.vpnUser?.commonName || "Unknown"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(session.startTime), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {session.endTime
                            ? format(new Date(session.endTime), "MMM d, HH:mm")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {formatDuration(session.startTime, session.endTime)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatBytes(inBytes)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatBytes(outBytes)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">
                          {formatBytes(total)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
