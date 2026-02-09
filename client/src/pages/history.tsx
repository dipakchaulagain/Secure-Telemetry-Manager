import { useSessionHistory } from "@/hooks/use-data";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(start: string, end?: string) {
  if (!end) return "Ongoing";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export default function HistoryPage() {
  const { data: sessions, isLoading } = useSessionHistory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Session History</h1>
        <p className="text-muted-foreground">Historical record of all past VPN connections.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Past Connections</CardTitle>
          <CardDescription>
            Archived session data for compliance and troubleshooting.
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
                  <TableHead>Duration</TableHead>
                  <TableHead>Remote IP</TableHead>
                  <TableHead className="text-right">Data Transfer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading history...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sessions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No history records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions?.map((session: any) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {session.vpnUser.commonName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(session.startTime), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {session.endTime ? format(new Date(session.endTime), "MMM d, HH:mm") : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDuration(session.startTime, session.endTime)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {session.remoteIp}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatBytes((session.bytesReceived || 0) + (session.bytesSent || 0))}
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
