import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export default function ChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();

    // If user doesn't need to change password, redirect home
    if (user && !user.mustChangePassword) {
        setLocation("/");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters");
            return;
        }

        if (currentPassword === newPassword) {
            setError("New password must be different from current password");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
                credentials: "include",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to change password");
            }

            const updatedUser = await res.json();
            // Update the cached user data so mustChangePassword is now false
            queryClient.setQueryData([api.auth.me.path], updatedUser);
            setLocation("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-primary/5 pointer-events-none" />

            <Card className="w-full max-w-md shadow-2xl shadow-black/5 border-border/50 bg-background/80 backdrop-blur-xl">
                <CardHeader className="text-center space-y-2 pb-6">
                    <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-2">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Change Your Password</CardTitle>
                    <CardDescription>
                        For security, you must set a new password before continuing.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Minimum 8 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        {newPassword.length > 0 && (
                            <div className="space-y-1.5 text-xs">
                                <div className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    <CheckCircle2 className="h-3 w-3" />
                                    At least 8 characters
                                </div>
                                <div className={`flex items-center gap-1.5 ${newPassword === confirmPassword && confirmPassword.length > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    <CheckCircle2 className="h-3 w-3" />
                                    Passwords match
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full h-11 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating Password...
                                </>
                            ) : (
                                "Set New Password"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
