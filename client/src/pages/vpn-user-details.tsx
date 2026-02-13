import { useVpnUser, useActiveSessions, useSessionHistory } from "@/hooks/use-data";
import { useRoute } from "wouter";
import { format } from "date-fns";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function VpnUserDetailsPage() {
    const [, params] = useRoute("/vpn-users/:id");
    const id = params?.id ? parseInt(params.id) : 0;

    const { data: user, isLoading: isLoadingUser } = useVpnUser(id);
    const { data: activeSessions, isLoading: isLoadingActive } = useActiveSessions();
    const { data: historySessions, isLoading: isLoadingHistory } = useSessionHistory();

    const currentSession = activeSessions?.find(
        (s: any) => s.vpnUser.id === id,
    );

    const lastClosedSession = useMemo(() => {
        const closed = historySessions?.filter(
            (s: any) => s.vpnUser.id === id,
        );
        if (!closed || closed.length === 0) return undefined;
        return closed.sort(
            (a: any, b: any) =>
                new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
        )[0];
    }, [historySessions, id]);

    const session = currentSession || lastClosedSession;
    const isLoading = isLoadingUser || isLoadingActive || isLoadingHistory;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <h2 className="text-xl font-semibold">User not found</h2>
                <Link href="/vpn-users">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Directory
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/vpn-users">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <User className="h-6 w-6 text-primary" />
                        {user.commonName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        VPN user details and connection history.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>User Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground font-medium">Full Name</p>
                                <p>{user.fullName || "—"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium">Email</p>
                                <p>{user.email || "—"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium">Contact</p>
                                <p>{user.contact || "—"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium">Type</p>
                                <p>{user.type}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium">Account Status</p>
                                <Badge
                                    variant="outline"
                                    className={`capitalize mt-1 ${user.accountStatus === "VALID"
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
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium">Connection</p>
                                <Badge
                                    variant="outline"
                                    className={`capitalize mt-1 ${user.status === "online"
                                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-muted bg-muted/30 text-muted-foreground"
                                        }`}
                                >
                                    <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${user.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                                        }`} />
                                    {user.status}
                                </Badge>
                            </div>
                            {user.expirationDate && (
                                <div>
                                    <p className="text-muted-foreground font-medium">{user.accountStatus === "EXPIRED" ? "Expired On" : "Expires On"}</p>
                                    <p className="font-mono text-sm mt-1 px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 inline-block">
                                        {format(new Date(user.expirationDate), "PP HH:mm")}
                                    </p>
                                </div>
                            )}
                            {user.revocationDate && (
                                <div>
                                    <p className="text-muted-foreground font-medium">Revoked On</p>
                                    <p className="font-mono text-sm mt-1 px-2 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-medium inline-block">
                                        {format(new Date(user.revocationDate), "PP HH:mm")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {currentSession ? "Current Session" : "Last Session"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        {session ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-muted-foreground font-medium">Remote IP</p>
                                        <p className="font-mono">{session.remoteIp || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-medium">VPN IP</p>
                                        <p className="font-mono">{session.virtualIp || "—"}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-muted-foreground font-medium">Connected At</p>
                                    <p>{format(new Date(session.startTime), "PPpp")}</p>
                                </div>

                                <div>
                                    <p className="text-muted-foreground font-medium">Disconnected At</p>
                                    <p>
                                        {session.endTime
                                            ? format(new Date(session.endTime), "PPpp")
                                            : currentSession
                                                ? <span className="text-green-600 font-medium">Active</span>
                                                : "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-muted-foreground font-medium mb-1">Data Transfer</p>
                                    <div className="flex gap-4">
                                        <span className="text-green-600">
                                            ↑ {formatBytes(session.bytesSent || 0)}
                                        </span>
                                        <span className="text-blue-600">
                                            ↓ {formatBytes(session.bytesReceived || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground py-4">
                                No session data available for this user yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>CCD Configuration</CardTitle>
                    <CardDescription>
                        Static IP and route directives configured in client-config-dir.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-muted-foreground font-medium">Static IP</p>
                            <p className="font-mono bg-muted/50 p-2 rounded mt-1">
                                {user.ccdStaticIp || "Not configured"}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground font-medium">Routes</p>
                            <p className="font-mono bg-muted/50 p-2 rounded mt-1">
                                {user.ccdRoutes || "No custom routes"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
