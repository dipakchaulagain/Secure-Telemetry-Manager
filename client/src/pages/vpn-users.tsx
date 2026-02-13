import { useVpnUsers, useActiveSessions, useSessionHistory, useUpdateVpnUser } from "@/hooks/use-data";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface VpnUserDetailsProps {
  user: any;
  onClose: () => void;
}

function VpnUserDetails({ user, onClose }: VpnUserDetailsProps) {
  const { data: activeSessions } = useActiveSessions();
  const { data: historySessions } = useSessionHistory();

  const currentSession = activeSessions?.find(
    (s: any) => s.vpnUser.id === user.id,
  );

  const lastClosedSession = useMemo(() => {
    const closed = historySessions?.filter(
      (s: any) => s.vpnUser.id === user.id,
    );
    if (!closed || closed.length === 0) return undefined;
    return closed.sort(
      (a: any, b: any) =>
        new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
    )[0];
  }, [historySessions, user.id]);

  const session = currentSession || lastClosedSession;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl bg-card shadow-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {user.commonName}
            </h2>
            <p className="text-xs text-muted-foreground">
              VPN user details and last connection information.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">User Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Full Name: </span>
                {user.fullName || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Email: </span>
                {user.email || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Contact: </span>
                {user.contact || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Type: </span>
                {user.type}
              </p>
              <p>
                <span className="text-muted-foreground">Status: </span>
                <Badge
                  variant={user.status === "online" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {user.status}
                </Badge>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {currentSession ? "Current Session" : "Last Session"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {session ? (
                <>
                  <p>
                    <span className="text-muted-foreground">Remote IP: </span>
                    {session.remoteIp || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">VPN IP: </span>
                    {session.virtualIp || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Connected At:{" "}
                    </span>
                    {format(new Date(session.startTime), "PPpp")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Disconnected At:{" "}
                    </span>
                    {session.endTime
                      ? format(new Date(session.endTime), "PPpp")
                      : currentSession
                        ? "Active"
                        : "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Bytes In/Out: </span>
                    {formatBytes(session.bytesReceived || 0)} /{" "}
                    {formatBytes(session.bytesSent || 0)}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  No session data available for this user yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CCD Information</CardTitle>
            <CardDescription>
              Static IP and route directives (if configured in CCD).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Static IP: </span>
              {user.ccdStaticIp || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Routes: </span>
              {user.ccdRoutes || "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VpnUsersPage() {
  const { data: users, isLoading } = useVpnUsers();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const updateMutation = useUpdateVpnUser();

  const filteredUsers = users?.filter((u: any) =>
    u.commonName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Directory</CardTitle>
              <CardDescription className="mt-1">
                Historical usage stats and current status for all users.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Common Name</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Connected</TableHead>
                  <TableHead className="text-right">Total Sent</TableHead>
                  <TableHead className="text-right">Total Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading directory...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          {user.commonName}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.fullName || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "online" ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastConnected
                          ? format(
                            new Date(user.lastConnected),
                            "MMM d, yyyy HH:mm",
                          )
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatBytes(user.totalBytesSent || 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatBytes(user.totalBytesReceived || 0)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          Details
                        </Button>
                        {currentUser?.role === "admin" && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() =>
                              setEditingUser({
                                id: user.id,
                                fullName: user.fullName || "",
                                email: user.email || "",
                                contact: user.contact || "",
                                type: user.type,
                              })
                            }
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <VpnUserDetails
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-card shadow-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Edit VPN User</h2>
                <p className="text-xs text-muted-foreground">
                  Common Name is immutable; update metadata only.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1 text-sm">
                <label className="text-muted-foreground">Full Name</label>
                <Input
                  value={editingUser.fullName}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      fullName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1 text-sm">
                <label className="text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1 text-sm">
                <label className="text-muted-foreground">
                  Contact (optional)
                </label>
                <Input
                  value={editingUser.contact}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      contact: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={updateMutation.isPending}
                onClick={() => {
                  updateMutation.mutate(
                    {
                      id: editingUser.id,
                      fullName: editingUser.fullName || null,
                      email: editingUser.email || null,
                      contact: editingUser.contact || null,
                    },
                    {
                      onSuccess: () => setEditingUser(null),
                    },
                  );
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
