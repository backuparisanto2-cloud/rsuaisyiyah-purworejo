import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Login Admin · RSU Aisyiyah Purworejo" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { session, isAdmin, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: isAdmin ? "/administrator" : "/" });
    }
  }, [session, isAdmin, loading, navigate]);

  async function handleLogin() {
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success("Login berhasil");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Admin CMS</h1>
          <p className="text-sm text-muted-foreground">RSU Aisyiyah Purworejo</p>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === "Enter") void handleLogin(); }} />
          </div>
          <Button className="w-full" disabled={busy} onClick={handleLogin}>
            {busy ? "Memproses..." : "Login"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Pendaftaran akun baru dinonaktifkan. Hubungi administrator untuk akses.
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">← Kembali ke website</Link>
        </div>
      </Card>
    </div>
  );
}
