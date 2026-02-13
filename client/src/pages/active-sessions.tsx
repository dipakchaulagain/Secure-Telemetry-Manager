import { useState, useEffect } from "react";
import { useActiveSessions } from "@/hooks/use-data";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function calculateDuration(startTime: string) {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  const diff = now - start;

  if (diff < 0) return "0m";

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export default function ActiveSessionsPage() {
  const { data: sessions, isLoading, refetch, isRefetching } = useActiveSessions();
  // Force re-render every minute to update duration
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t: number) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <Card className="shadow-none border-0 bg-transparent">
        <CardHeader className="px-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Connections</CardTitle>
              <CardDescription className="mt-1">
                Real-time list of established tunnels.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Common Name</TableHead>
                  <TableHead>Remote IP</TableHead>
                  <TableHead>Virtual IP</TableHead>
                  <TableHead>Connected At</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Sent / Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading sessions...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sessions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No active sessions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions?.map((session: any) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          {session.vpnUser.commonName}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{session.remoteIp}</TableCell>
                      <TableCell className="font-mono text-xs">{session.virtualIp || "N/A"}</TableCell>
                      <TableCell>{format(new Date(session.startTime), "MMM d, HH:mm:ss")}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {calculateDuration(session.startTime)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <span className="text-green-600">↑{formatBytes(session.bytesSent)}</span>
                        <span className="mx-1 text-muted-foreground">/</span>
                        <span className="text-blue-600">↓{formatBytes(session.bytesReceived)}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
