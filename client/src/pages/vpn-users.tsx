import { useVpnUsers, useUpdateVpnUser } from "@/hooks/use-data";
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
import { Loader2, Search, User, Eye, Pencil } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function VpnUsersPage() {
  const { data: users, isLoading } = useVpnUsers();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
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
                  <TableHead>Account Status</TableHead>
                  <TableHead>Connection</TableHead>
                  <TableHead>Last Connected</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading directory...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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
                          variant="outline"
                          className={`capitalize ${user.accountStatus === "VALID"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : user.accountStatus === "REVOKED"
                              ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                              : user.accountStatus === "EXPIRED"
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "border-muted text-muted-foreground"
                            }`}
                        >
                          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${user.accountStatus === "VALID" ? "bg-emerald-500" :
                            user.accountStatus === "REVOKED" ? "bg-red-500" :
                              user.accountStatus === "EXPIRED" ? "bg-amber-500" : "bg-muted-foreground"
                            }`} />
                          {user.accountStatus || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize ${user.status === "online"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border-muted bg-muted/30 text-muted-foreground"
                            }`}
                        >
                          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${user.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                            }`} />
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/vpn-users/${user.id}`}>
                            <Button
                              size="xs"
                              variant="ghost"
                              className="gap-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all duration-200"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                          </Link>
                          {currentUser?.role === "admin" && (
                            <Button
                              size="xs"
                              variant="ghost"
                              className="gap-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all duration-200"
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
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
