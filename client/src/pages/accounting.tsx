import { useSessionHistory } from "@/hooks/use-data";
import { format } from "date-fns";
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
import { Loader2 } from "lucide-react";
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

export default function AccountingPage() {
  const { data: sessions, isLoading } = useSessionHistory();

  const chartData =
    sessions?.reduce((acc: Record<string, { date: string; totalBytes: number }>, s: any) => {
      const day = format(new Date(s.startTime), "yyyy-MM-dd");
      const inBytes = s.bytesReceived || 0;
      const outBytes = s.bytesSent || 0;
      const total = inBytes + outBytes;

      if (!acc[day]) {
        acc[day] = { date: day, totalBytes: 0 };
      }
      acc[day].totalBytes += total;
      return acc;
    }, {}) ?? {};

  const chartSeries = Object.values(chartData).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
        <p className="text-muted-foreground">
          Session-level accounting data, historical connection logs, and usage
          trends.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Accounting</CardTitle>
          <CardDescription>
            Per-session connection history for audit and compliance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Ended</TableHead>
                  <TableHead className="text-right">Bytes In</TableHead>
                  <TableHead className="text-right">Bytes Out</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading accounting data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sessions?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No session records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions?.map((session: any) => {
                    const inBytes = session.bytesReceived || 0;
                    const outBytes = session.bytesSent || 0;
                    const total = inBytes + outBytes;

                    return (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {session.vpnUser.commonName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(
                            new Date(session.startTime),
                            "MMM d, HH:mm",
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {session.endTime
                            ? format(
                                new Date(session.endTime),
                                "MMM d, HH:mm",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatBytes(inBytes)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatBytes(outBytes)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
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

      <Card>
        <CardHeader>
          <CardTitle>Traffic Over Time</CardTitle>
          <CardDescription>
            Aggregated data transfer per day based on session history.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">
                Loading accounting data...
              </span>
            </div>
          ) : chartSeries.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No historical data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSeries}>
                <defs>
                  <linearGradient id="acctTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
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
                  tickFormatter={(value) => formatBytes(value as number)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => formatBytes(value as number)}
                />
                <Area
                  type="monotone"
                  dataKey="totalBytes"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#acctTraffic)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

