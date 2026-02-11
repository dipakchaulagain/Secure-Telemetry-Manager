import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Server, Copy, Plus, Loader2 } from "lucide-react";

export default function VpnServersPage() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
        <Shield className="h-16 w-16 text-muted-foreground/50" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You do not have permission to view this page. Only administrators can manage VPN servers.
        </p>
      </div>
    );
  }

  // Placeholder UI; backend wiring would list and create servers with server_id + api_key
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">VPN Servers</h1>
          <p className="text-muted-foreground">
            Register OpenVPN servers and retrieve server IDs and API keys for telemetry agents.
          </p>
        </div>
        <Button className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          Add Server
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Servers</CardTitle>
          <CardDescription>List of VPN servers sending telemetry to this portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Server ID</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                    VPN server management API wiring not yet implemented.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

