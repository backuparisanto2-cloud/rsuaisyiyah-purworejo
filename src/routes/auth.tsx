import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Login Admin · RSU Aisyiyah Purworejo" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { session, isAdmin, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: isAdmin ? "/administrator" : "/" });
    }
  }, [session, isAdmin, loading, navigate]);

  async function handle(kind: "in" | "up") {
    setBusy(true);
    const { error } = kind === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success(kind === "in" ? "Login berhasil" : "Akun dibuat, silakan login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Admin CMS</h1>
          <p className="text-sm text-muted-foreground">RSU Aisyiyah Purworejo</p>
        </div>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Daftar</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-3 mt-4">
            <FormFields email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
            <Button className="w-full" disabled={busy} onClick={() => handle("in")}>
              {busy ? "Memproses..." : "Login"}
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-3 mt-4">
            <FormFields email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
            <Button className="w-full" disabled={busy} onClick={() => handle("up")}>
              {busy ? "Memproses..." : "Daftar"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Akun admin pertama: <b>rsaisyiyahpurworejo@gmail.com</b>
            </p>
          </TabsContent>
        </Tabs>
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">← Kembali ke website</Link>
        </div>
      </Card>
    </div>
  );
}

function FormFields(p: { email: string; setEmail: (v: string) => void; password: string; setPassword: (v: string) => void }) {
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={p.email} onChange={(e) => p.setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={p.password} onChange={(e) => p.setPassword(e.target.value)} autoComplete="current-password" />
      </div>
    </>
  );
}
