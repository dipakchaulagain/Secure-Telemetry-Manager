import { useActiveSessions, useKillSession } from "@/hooks/use-data";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, PowerOff, RefreshCw } from "lucide-react";
import { useState } from "react";

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function ActiveSessionsPage() {
  const { data: sessions, isLoading, refetch, isRefetching } = useActiveSessions();
  const killMutation = useKillSession();
  const [sessionToKill, setSessionToKill] = useState<number | null>(null);

  const handleKill = async () => {
    if (sessionToKill) {
      await killMutation.mutateAsync(sessionToKill);
      setSessionToKill(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
          <p className="text-muted-foreground">Manage currently connected VPN clients.</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Live Connections</CardTitle>
          <CardDescription>
            Real-time list of established tunnels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Common Name</TableHead>
                  <TableHead>Remote IP</TableHead>
                  <TableHead>Virtual IP</TableHead>
                  <TableHead>Connected At</TableHead>
                  <TableHead className="text-right">Sent / Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right font-mono text-xs">
                        <span className="text-green-600">↑{formatBytes(session.bytesSent)}</span>
                        <span className="mx-1 text-muted-foreground">/</span>
                        <span className="text-blue-600">↓{formatBytes(session.bytesReceived)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog open={sessionToKill === session.id} onOpenChange={(open) => !open && setSessionToKill(null)}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => setSessionToKill(session.id)}
                            >
                              <PowerOff className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Terminate Session?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to disconnect <strong>{session.vpnUser.commonName}</strong>? 
                                This will immediately drop their VPN connection.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleKill}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {killMutation.isPending ? "Terminating..." : "Terminate Connection"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
